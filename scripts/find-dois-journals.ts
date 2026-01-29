/**
 * Find DOIs for Japanese journal papers
 * Searches by author + year + journal keywords instead of Japanese title
 *
 * Usage: npm run find-dois-journals
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const CROSSREF_API = 'https://api.crossref.org/works';
const DELAY_MS = 1000;
const MATCH_THRESHOLD = 0.5;

interface Publication {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  type?: string;
  tags?: string[];
  [key: string]: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isJapanese(text: string): boolean {
  if (!text) return false;
  const jpChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
  return jpChars / text.length > 0.3;
}

/**
 * Extract the last name from author string
 */
function getLastName(author: string): string {
  // Handle "Firstname Lastname" or "Lastname, Firstname" formats
  const parts = author.split(/[,\s]+/);
  // For Japanese names, first part is usually family name
  // For Western names, last part is usually family name
  if (isJapanese(author)) {
    return parts[0];
  }
  return parts[parts.length - 1];
}

/**
 * Map Japanese journal names to English equivalents for searching
 */
function getJournalSearchTerms(journal: string): string {
  const mappings: Record<string, string> = {
    '電気学会論文誌': 'IEEJ Transactions',
    '電子情報システム部門': 'Electronics Information Systems',
    '生体医工学': 'Biomedical Engineering',
    'バイオメディカル': 'Biomedical',
  };

  let terms = 'IEEJ'; // Default for electrical engineering papers
  for (const [jp, en] of Object.entries(mappings)) {
    if (journal.includes(jp)) {
      terms = en;
      break;
    }
  }
  return terms;
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
 * Calculate word overlap similarity
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
 * Check if authors match
 */
function authorsMatch(pubAuthors: string[], crossrefAuthors: { given?: string; family?: string }[]): boolean {
  if (!pubAuthors?.length || !crossrefAuthors?.length) return false;

  const pubNames = pubAuthors.map(a => normalize(getLastName(a)));
  const crNames = crossrefAuthors.map(a => normalize(a.family || ''));

  // Check if at least one author matches
  return pubNames.some(pn => crNames.some(cn => cn.includes(pn) || pn.includes(cn)));
}

interface CrossRefResult {
  doi: string;
  title: string;
  authors: { given?: string; family?: string }[];
  year?: number;
  score: number;
}

async function searchCrossRef(
  authorLastName: string,
  year: number,
  journalTerms: string
): Promise<CrossRefResult[]> {
  try {
    const query = encodeURIComponent(`${authorLastName}`);
    const journalQuery = encodeURIComponent(journalTerms);
    const url = `${CROSSREF_API}?query.author=${query}&query.container-title=${journalQuery}&filter=from-pub-date:${year - 1},until-pub-date:${year + 1}&rows=10`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LabWebsite/1.0 (mailto:takahashi@i.u-tokyo.ac.jp)'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    const items = data.message?.items || [];

    return items.map((item: any) => ({
      doi: item.DOI,
      title: item.title?.[0] || '',
      authors: item.author || [],
      year: item.published?.['date-parts']?.[0]?.[0],
      score: 0,
    }));
  } catch (err) {
    console.error(`  CrossRef error: ${err}`);
    return [];
  }
}

function loadJournalPapersWithoutDoi(): { filePath: string; data: Publication }[] {
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const results: { filePath: string; data: Publication }[] = [];

  const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  for (const file of files) {
    const filePath = path.join(pubsDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.load(content) as Publication;

      // Only include journal papers without DOI
      if (!data.doi && data.type === 'journal') {
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
  console.log('=== Find DOIs for Japanese Journal Papers ===\n');

  const publications = loadJournalPapersWithoutDoi();
  console.log(`Found ${publications.length} journal papers without DOI\n`);

  if (publications.length === 0) {
    console.log('Nothing to search!');
    return;
  }

  let found = 0;
  let notFound = 0;

  for (let i = 0; i < publications.length; i++) {
    const { filePath, data } = publications[i];
    const title = data.title?.slice(0, 50) || data.id;

    console.log(`[${i + 1}/${publications.length}] ${title}...`);

    // Get first author's last name
    const firstAuthor = data.authors?.[0] || 'Takahashi';
    const lastName = getLastName(firstAuthor);

    // Get journal search terms
    const journalTerms = getJournalSearchTerms(data.journal || '');

    console.log(`  Searching: author="${lastName}" journal="${journalTerms}" year=${data.year}`);

    const results = await searchCrossRef(lastName, data.year, journalTerms);

    if (results.length === 0) {
      console.log('  ✗ No results');
      notFound++;
      await sleep(DELAY_MS);
      continue;
    }

    // Find best match by checking author overlap and year
    let bestMatch: CrossRefResult | null = null;
    let bestScore = 0;

    for (const result of results) {
      // Must have matching year (within 1)
      if (result.year && Math.abs(result.year - data.year) > 1) continue;

      // Must have at least one matching author
      if (!authorsMatch(data.authors, result.authors)) continue;

      // Score based on how many authors match
      const pubNames = data.authors.map(a => normalize(getLastName(a)));
      const crNames = result.authors.map(a => normalize(a.family || ''));
      const matchCount = pubNames.filter(pn => crNames.some(cn => cn.includes(pn) || pn.includes(cn))).length;
      const score = matchCount / Math.max(pubNames.length, crNames.length);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = result;
        bestMatch.score = score;
      }
    }

    if (bestMatch && bestScore >= MATCH_THRESHOLD) {
      console.log(`  Found: ${bestMatch.title.slice(0, 50)}...`);
      console.log(`  Authors match: ${(bestScore * 100).toFixed(0)}%`);
      console.log(`  ✓ Adding DOI: ${bestMatch.doi}`);
      data.doi = bestMatch.doi;
      savePublication(filePath, data);
      found++;
    } else if (bestMatch) {
      console.log(`  Found but low confidence: ${bestMatch.title.slice(0, 50)}...`);
      console.log(`  Authors match: ${(bestScore * 100).toFixed(0)}%`);
      notFound++;
    } else {
      console.log('  ✗ No matching paper found');
      notFound++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n=== Done ===`);
  console.log(`DOIs found: ${found}`);
  console.log(`Not found: ${notFound}`);
}

main().catch(console.error);
