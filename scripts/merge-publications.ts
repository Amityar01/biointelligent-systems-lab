/**
 * Merge all parsed publication batches into one clean publications.json
 * For papers with DOIs, fetches authoritative data from CrossRef API.
 *
 * Run after Ollama parsing completes: npx ts-node scripts/merge-publications.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSED_DIR = path.join(__dirname, '..', 'scraped', 'parsed');
const OUTPUT_FILE = path.join(__dirname, '..', 'content', 'publications', 'all.json');
const CROSSREF_CACHE = path.join(PARSED_DIR, 'crossref-cache.json');

// Rate limit: CrossRef asks for max 50 req/sec, we'll do 10/sec to be safe
const CROSSREF_DELAY = 100; // ms between requests

// Load/save CrossRef cache to avoid re-fetching
let crossrefCache: Record<string, any> = {};
function loadCache() {
  if (fs.existsSync(CROSSREF_CACHE)) {
    crossrefCache = JSON.parse(fs.readFileSync(CROSSREF_CACHE, 'utf-8'));
  }
}
function saveCache() {
  fs.writeFileSync(CROSSREF_CACHE, JSON.stringify(crossrefCache, null, 2));
}

async function fetchCrossRef(doi: string): Promise<any | null> {
  if (crossrefCache[doi]) return crossrefCache[doi];

  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LabWebsite/1.0 (mailto:takahashi@i.u-tokyo.ac.jp)' }
    });

    if (!res.ok) {
      crossrefCache[doi] = { error: res.status };
      return null;
    }

    const data = await res.json();
    crossrefCache[doi] = data.message;
    return data.message;
  } catch (e) {
    crossrefCache[doi] = { error: String(e) };
    return null;
  }
}

function crossrefToPub(cr: any, ollamaParsed: any, category: string): Publication {
  // Extract authors from CrossRef format
  const authors = (cr.author || []).map((a: any) => {
    if (a.given && a.family) return `${a.given} ${a.family}`;
    if (a.name) return a.name;
    return a.family || 'Unknown';
  });

  // Get year from published-print or published-online
  let year: number | null = null;
  if (cr['published-print']?.['date-parts']?.[0]?.[0]) {
    year = cr['published-print']['date-parts'][0][0];
  } else if (cr['published-online']?.['date-parts']?.[0]?.[0]) {
    year = cr['published-online']['date-parts'][0][0];
  }

  // Determine type
  let type: Publication['type'] = 'journal';
  if (cr.type === 'proceedings-article') type = 'conference';
  else if (cr.type === 'book-chapter') type = 'book-chapter';
  else if (cr.type === 'book') type = 'book';

  const pub: Publication = {
    id: '',
    type,
    title: Array.isArray(cr.title) ? cr.title[0] : cr.title || ollamaParsed.title,
    authors: authors.length > 0 ? authors : ollamaParsed.authors || [],
    year,
    language: detectLanguage(ollamaParsed._raw || ''),
    category,
    _raw: ollamaParsed.raw || '',
    _source: 'crossref',
  };

  // Journal info
  if (cr['container-title']?.[0]) pub.journal = cr['container-title'][0];
  if (cr.volume) pub.volume = cr.volume;
  if (cr.issue) pub.issue = cr.issue;
  if (cr.page) pub.pages = cr.page;

  // DOI
  pub.doi = cr.DOI;

  // URL
  if (cr.URL) pub.url = cr.URL;

  // Keep awards from Ollama (CrossRef doesn't have these)
  const awards = cleanAwards(ollamaParsed.awards, ollamaParsed.raw || '');
  if (awards.length > 0) pub.awards = awards;

  return pub;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Normalized publication schema (matches CrossRef API structure)
interface Publication {
  id: string;
  type: 'journal' | 'conference' | 'book' | 'book-chapter' | 'review' | 'presentation' | 'preprint';
  title: string;
  authors: string[];
  year: number | null;
  // Journal/conference
  journal?: string;
  conference?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  // Identifiers
  doi?: string;
  arxiv?: string;
  url?: string;
  // Extra
  publisher?: string;
  location?: string;
  date?: string;
  awards?: string[];
  // Metadata
  language: 'ja' | 'en';
  category: string;
  _raw: string;
  _source?: 'crossref' | 'ollama';
  _parseErrors?: string[];
}

function generateId(pub: any, index: number): string {
  const year = pub.year || 'unknown';
  const firstAuthor = (pub.authors?.[0] || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);
  const titleSlug = (pub.title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  return `${year}-${firstAuthor}-${titleSlug}-${index}`;
}

function detectLanguage(text: string): 'ja' | 'en' {
  // Check for Japanese characters
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
  return hasJapanese ? 'ja' : 'en';
}

function normalizeType(type: string | undefined, category: string): Publication['type'] {
  const cat = category.toLowerCase();
  if (cat.includes('presentation') || cat.includes('発表')) return 'presentation';
  if (cat.includes('review') || cat.includes('総説')) return 'review';
  if (cat.includes('book') || cat.includes('著書')) {
    if (cat.includes('chapter')) return 'book-chapter';
    return 'book';
  }
  if (cat.includes('conference') || cat.includes('会議')) return 'conference';

  // Check for preprints
  if (type === 'journal') return 'journal';
  return 'journal'; // default
}

function normalizeDoi(doi: string | undefined): string | undefined {
  if (!doi) return undefined;
  // Remove URL prefix if present
  doi = doi.replace(/^https?:\/\/doi\.org\//, '');
  // Check if it looks like a real DOI (starts with 10.)
  if (doi.startsWith('10.')) return doi;
  return undefined;
}

function extractArxiv(pub: any): string | undefined {
  // Check if DOI is actually arXiv
  if (pub.doi && !pub.doi.startsWith('10.')) {
    if (/^\d{4}\.\d{4,5}$/.test(pub.doi)) return pub.doi;
  }
  // Check URL for arXiv
  if (pub.url?.includes('arxiv.org')) {
    const match = pub.url.match(/(\d{4}\.\d{4,5})/);
    if (match) return match[1];
  }
  return undefined;
}

function normalizePages(pages: string | undefined): string | undefined {
  if (!pages) return undefined;
  // Clean up common patterns
  return pages
    .replace(/^pp?\.?\s*/i, '')  // Remove "pp." prefix
    .replace(/\s*\(\d+\s*pp?\.?\)$/i, '')  // Remove "(11 pp.)" suffix
    .trim();
}

function cleanAwards(awards: any[] | undefined, raw: string): string[] {
  if (!awards || !Array.isArray(awards)) {
    // Try to extract from raw
    const matches = raw.match(/\[([^\]]+)\]/g);
    if (matches) {
      return matches
        .map(m => m.slice(1, -1))
        .filter(a => !a.match(/^\d+$/) && a.length > 1);
    }
    return [];
  }
  // Filter out numeric-only "awards" (parsing errors)
  return awards.filter(a => typeof a === 'string' && !a.match(/^\d+$/) && a.length > 1);
}

function normalizePub(raw: any, category: string, categoryTitle: string): Publication {
  const errors: string[] = [];

  if (raw.parseError) {
    errors.push(raw.parseError);
  }

  const title = raw.title || '';
  const language = detectLanguage(raw._raw || title);

  const pub: Publication = {
    id: '', // Will be set after
    type: normalizeType(raw.type, categoryTitle),
    title: title.replace(/^「|」$/g, '').replace(/^"|"$/g, ''), // Remove quotes
    authors: Array.isArray(raw.authors) ? raw.authors : [],
    year: typeof raw.year === 'number' ? raw.year : null,
    language,
    category,
    _raw: raw.raw || '',
  };

  // Optional fields
  if (raw.journal) pub.journal = raw.journal;
  if (raw.conference) pub.conference = raw.conference;
  if (raw.volume) pub.volume = String(raw.volume);
  if (raw.issue) pub.issue = String(raw.issue);
  if (raw.pages) pub.pages = normalizePages(raw.pages);
  if (raw.publisher) pub.publisher = raw.publisher;
  if (raw.location) pub.location = raw.location;
  if (raw.date) pub.date = raw.date;

  // Identifiers
  const doi = normalizeDoi(raw.doi);
  if (doi) pub.doi = doi;

  const arxiv = extractArxiv(raw);
  if (arxiv) {
    pub.arxiv = arxiv;
    pub.type = 'preprint';
  }

  if (raw.url && !raw.url.includes('doi.org')) pub.url = raw.url;

  // Awards
  const awards = cleanAwards(raw.awards, raw.raw || '');
  if (awards.length > 0) pub.awards = awards;

  // Track errors
  if (errors.length > 0) pub._parseErrors = errors;
  if (!pub.title) errors.push('Missing title');
  if (pub.authors.length === 0) errors.push('Missing authors');

  pub._source = 'ollama';
  return pub;
}

async function main() {
  console.log('Merging parsed publications...\n');

  // Load CrossRef cache
  loadCache();
  console.log(`CrossRef cache: ${Object.keys(crossrefCache).length} entries\n`);

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find all parsed batch files
  const files = fs.readdirSync(PARSED_DIR)
    .filter(f => f.match(/^batch-\d+-parsed\.json$/))
    .sort();

  console.log(`Found ${files.length} parsed batch files`);

  const allPubs: Publication[] = [];
  const stats = {
    total: 0,
    withErrors: 0,
    fromCrossRef: 0,
    fromOllama: 0,
    crossrefFailed: 0,
    byType: {} as Record<string, number>,
    byYear: {} as Record<string, number>,
    byLanguage: { ja: 0, en: 0 },
  };

  // First pass: collect all items and DOIs
  const allItems: { item: any; category: string; categoryTitle: string }[] = [];
  for (const file of files) {
    const batch = JSON.parse(fs.readFileSync(path.join(PARSED_DIR, file), 'utf-8'));
    for (const item of batch.items) {
      allItems.push({ item, category: batch.category, categoryTitle: batch.categoryTitle });
    }
  }

  console.log(`Total items: ${allItems.length}`);

  // Count DOIs
  const itemsWithDoi = allItems.filter(({ item }) => {
    const doi = normalizeDoi(item.doi);
    return doi && doi.startsWith('10.');
  });
  console.log(`Items with DOI: ${itemsWithDoi.length}`);
  console.log(`Items without DOI: ${allItems.length - itemsWithDoi.length}\n`);

  // Process all items
  let processed = 0;
  for (const { item, category, categoryTitle } of allItems) {
    const doi = normalizeDoi(item.doi);
    let pub: Publication;

    if (doi && doi.startsWith('10.')) {
      // Try CrossRef
      const cr = await fetchCrossRef(doi);
      if (cr && !cr.error) {
        pub = crossrefToPub(cr, item, category);
        stats.fromCrossRef++;
      } else {
        // CrossRef failed, use Ollama data
        pub = normalizePub(item, category, categoryTitle);
        pub._source = 'ollama';
        stats.fromOllama++;
        stats.crossrefFailed++;
      }
      await sleep(CROSSREF_DELAY);
    } else {
      // No DOI, use Ollama data
      pub = normalizePub(item, category, categoryTitle);
      pub._source = 'ollama';
      stats.fromOllama++;
    }

    pub.id = generateId(pub, allPubs.length);
    allPubs.push(pub);

    // Stats
    stats.total++;
    if (pub._parseErrors) stats.withErrors++;
    stats.byType[pub.type] = (stats.byType[pub.type] || 0) + 1;
    if (pub.year) stats.byYear[pub.year] = (stats.byYear[pub.year] || 0) + 1;
    stats.byLanguage[pub.language]++;

    // Progress
    processed++;
    if (processed % 50 === 0) {
      process.stdout.write(`\rProcessed ${processed}/${allItems.length} (${stats.fromCrossRef} from CrossRef)`);
      saveCache(); // Save cache periodically
    }
  }
  console.log(`\rProcessed ${processed}/${allItems.length} (${stats.fromCrossRef} from CrossRef)`);

  // Save final cache
  saveCache();

  // Sort by year (newest first), then by original index
  allPubs.sort((a, b) => {
    if (a.year && b.year) return b.year - a.year;
    if (a.year) return -1;
    if (b.year) return 1;
    return 0;
  });

  // Write output
  const output = {
    generatedAt: new Date().toISOString(),
    stats,
    publications: allPubs,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`\nOutput: ${OUTPUT_FILE}`);
  console.log(`Total publications: ${stats.total}`);
  console.log(`\nData sources:`);
  console.log(`  From CrossRef (authoritative): ${stats.fromCrossRef}`);
  console.log(`  From Ollama (parsed): ${stats.fromOllama}`);
  console.log(`  CrossRef lookup failed: ${stats.crossrefFailed}`);
  console.log(`\nWith parse errors: ${stats.withErrors}`);
  console.log('\nBy type:');
  Object.entries(stats.byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('\nBy language:');
  console.log(`  Japanese: ${stats.byLanguage.ja}`);
  console.log(`  English: ${stats.byLanguage.en}`);
}

main().catch(console.error);
