/**
 * Find DOIs for publications that don't have them
 * Skips Japanese conference papers (unlikely to have DOIs)
 * Uses CrossRef search API
 *
 * Usage: npm run find-dois
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const CROSSREF_API = 'https://api.crossref.org/works';

// Rate limit: 1 request per second
const DELAY_MS = 1000;

// Minimum similarity score to auto-accept a match
const MATCH_THRESHOLD = 0.7;

interface Publication {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  abstract?: string;
  type?: string;
  tags?: string[];
  [key: string]: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if text is primarily Japanese
 */
function isJapanese(text: string): boolean {
  if (!text) return false;
  // Count Japanese characters (hiragana, katakana, kanji)
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [];
  const ratio = japaneseChars.length / text.length;
  return ratio > 0.3; // If more than 30% Japanese chars, consider it Japanese
}

/**
 * Check if this is likely a Japanese conference paper
 */
function isJapaneseConference(pub: Publication): boolean {
  // Check title
  if (isJapanese(pub.title)) return true;

  // Check journal name for common Japanese conference patterns
  const journal = pub.journal?.toLowerCase() || '';
  const jpPatterns = [
    '学会', '大会', '研究会', 'シンポジウム', '講演', '発表',
    '日本', '電子情報通信', '計測自動制御', '機械学会',
  ];

  for (const pattern of jpPatterns) {
    if (journal.includes(pattern)) return true;
  }

  // Check tags
  if (pub.tags?.includes('japanese')) return true;

  return false;
}

/**
 * Normalize text for comparison
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two strings (Jaccard on words)
 */
function similarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalize(b).split(' ').filter(w => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}

/**
 * Check if authors overlap
 */
function authorsMatch(pubAuthors: string[], crossrefAuthors: { given?: string; family?: string }[]): boolean {
  if (!pubAuthors?.length || !crossrefAuthors?.length) return false;

  const pubNames = pubAuthors.map(a => normalize(a.split(' ').pop() || '')); // Last name
  const crNames = crossrefAuthors.map(a => normalize(a.family || ''));

  // Check if at least one author matches
  return pubNames.some(pn => crNames.some(cn => cn.includes(pn) || pn.includes(cn)));
}

async function searchCrossRef(title: string, year: number): Promise<{ doi: string; title: string; authors: { given?: string; family?: string }[]; score: number } | null> {
  try {
    const query = encodeURIComponent(title);
    const url = `${CROSSREF_API}?query.title=${query}&rows=3&filter=from-pub-date:${year - 1},until-pub-date:${year + 1}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LabWebsite/1.0 (mailto:takahashi@i.u-tokyo.ac.jp)'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const items = data.message?.items || [];

    if (items.length === 0) return null;

    // Find best match
    let bestMatch = null;
    let bestScore = 0;

    for (const item of items) {
      const itemTitle = item.title?.[0] || '';
      const score = similarity(title, itemTitle);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          doi: item.DOI,
          title: itemTitle,
          authors: item.author || [],
          score,
        };
      }
    }

    return bestMatch;
  } catch (err) {
    console.error(`  CrossRef error: ${err}`);
    return null;
  }
}

function loadPublicationsWithoutDoi(): { filePath: string; data: Publication }[] {
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const results: { filePath: string; data: Publication }[] = [];

  const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  for (const file of files) {
    const filePath = path.join(pubsDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.load(content) as Publication;

      // Only include if no DOI
      if (!data.doi) {
        results.push({ filePath, data });
      }
    } catch (err) {
      console.error(`Error loading ${file}:`, err);
    }
  }

  return results;
}

function savePublication(filePath: string, data: Publication): void {
  const content = yaml.dump(data, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
  });
  fs.writeFileSync(filePath, content);
}

async function main() {
  console.log('=== Find DOIs for Publications ===\n');

  const allPubs = loadPublicationsWithoutDoi();
  console.log(`Found ${allPubs.length} publications without DOI\n`);

  // Filter out Japanese conference papers
  const publications = allPubs.filter(p => !isJapaneseConference(p.data));
  const skipped = allPubs.length - publications.length;

  console.log(`Skipping ${skipped} Japanese conference papers`);
  console.log(`Searching for ${publications.length} papers\n`);

  if (publications.length === 0) {
    console.log('Nothing to search!');
    return;
  }

  let found = 0;
  let notFound = 0;
  let lowConfidence = 0;

  for (let i = 0; i < publications.length; i++) {
    const { filePath, data } = publications[i];
    const title = data.title?.slice(0, 50) || data.id;

    console.log(`[${i + 1}/${publications.length}] ${title}...`);

    const match = await searchCrossRef(data.title, data.year);

    if (match) {
      const authorMatch = authorsMatch(data.authors, match.authors);

      console.log(`  Found: ${match.title.slice(0, 50)}...`);
      console.log(`  Score: ${(match.score * 100).toFixed(0)}%, Authors: ${authorMatch ? '✓' : '✗'}`);

      if (match.score >= MATCH_THRESHOLD && authorMatch) {
        console.log(`  ✓ Adding DOI: ${match.doi}`);
        data.doi = match.doi;
        savePublication(filePath, data);
        found++;
      } else {
        console.log(`  ? Low confidence, skipping`);
        lowConfidence++;
      }
    } else {
      console.log('  ✗ No match found');
      notFound++;
    }

    // Rate limit
    if (i < publications.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`DOIs found: ${found}`);
  console.log(`Low confidence (skipped): ${lowConfidence}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Japanese papers skipped: ${skipped}`);
}

main().catch(console.error);
