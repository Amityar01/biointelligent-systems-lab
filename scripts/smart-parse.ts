/**
 * Smart Publication Parser
 * Strategy: Regex-first → Schema validate → LLM fallback (if regex fails)
 *
 * 1. Try category-specific regex parser first (fast, reliable)
 * 2. Validate against schema
 * 3. If invalid, try Ollama LLM parsing (slower)
 * 4. Validate LLM result
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  parseByCategory,
  isValid as isRegexValid,
  type ParsedPublication
} from './category-parsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCHES_DIR = path.join(__dirname, '..', 'scraped', 'batches');
const OUTPUT_DIR = path.join(__dirname, '..', 'scraped', 'parsed');
const CACHE_FILE = path.join(OUTPUT_DIR, 'crossref-cache.json');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progress.json');

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'glm4:9b'; // Faster and no thinking tags

// ============================================================
// SCHEMA DEFINITION
// ============================================================

interface Publication {
  id: string;
  type: 'journal' | 'conference' | 'book' | 'book-chapter' | 'review' | 'presentation' | 'preprint' | 'thesis';
  title: string;
  authors: string[];
  year: number | null;
  journal?: string;
  conference?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  arxiv?: string;
  url?: string;
  publisher?: string;
  awards?: string[];
  language: 'ja' | 'en';
  category: string;
  _source: 'crossref' | 'ollama';
  _raw: string;
  _valid: boolean;
  _errors?: string[];
}

// ============================================================
// SCHEMA VALIDATION
// ============================================================

function validatePublication(pub: Partial<Publication>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!pub.title || pub.title.trim().length === 0) {
    errors.push('Missing or empty title');
  }
  if (!pub.authors || !Array.isArray(pub.authors) || pub.authors.length === 0) {
    errors.push('Missing or empty authors');
  }
  if (!pub.type) {
    errors.push('Missing type');
  }

  // Type validation
  const validTypes = ['journal', 'conference', 'book', 'book-chapter', 'review', 'presentation', 'preprint', 'thesis'];
  if (pub.type && !validTypes.includes(pub.type)) {
    errors.push(`Invalid type: ${pub.type}`);
  }

  // Year validation
  if (pub.year !== null && pub.year !== undefined) {
    if (typeof pub.year !== 'number' || pub.year < 1950 || pub.year > 2030) {
      errors.push(`Invalid year: ${pub.year}`);
    }
  }

  // DOI format validation
  if (pub.doi && !pub.doi.match(/^10\.\d{4,}/)) {
    errors.push(`Invalid DOI format: ${pub.doi}`);
  }

  // Authors should be strings
  if (pub.authors) {
    for (const author of pub.authors) {
      if (typeof author !== 'string' || author.trim().length === 0) {
        errors.push(`Invalid author entry: ${author}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// DOI EXTRACTION
// ============================================================

function extractDoi(text: string): string | null {
  const patterns = [
    /doi\s*[:：]\s*(10\.[0-9]+\/[^\s\)\]"',]+)/i,
    /https?:\/\/doi\.org\/(10\.[0-9]+\/[^\s\)\]"',]+)/i,
    /\((10\.[0-9]{4,}\/[^\s\)\]"',]+)\)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let doi = match[1].trim();
      doi = doi.replace(/[.,;:\]）)]+$/, '');
      return doi;
    }
  }
  return null;
}

function extractArxiv(text: string): string | null {
  const match = text.match(/arxiv[:\s]*(\d{4}\.\d{4,5})/i);
  return match ? match[1] : null;
}

// ============================================================
// CROSSREF API
// ============================================================

let crossrefCache: Record<string, any> = {};

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    crossrefCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  }
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(crossrefCache, null, 2));
}

async function fetchCrossRef(doi: string): Promise<any | null> {
  if (crossrefCache[doi]) {
    return crossrefCache[doi].error ? null : crossrefCache[doi];
  }

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

function crossrefToPublication(cr: any, raw: string, category: string): Partial<Publication> {
  const authors = (cr.author || []).map((a: any) => {
    if (a.given && a.family) return `${a.given} ${a.family}`;
    if (a.name) return a.name;
    return a.family || 'Unknown';
  }).filter((a: string) => a && a !== 'Unknown');

  let year: number | null = null;
  if (cr['published-print']?.['date-parts']?.[0]?.[0]) {
    year = cr['published-print']['date-parts'][0][0];
  } else if (cr['published-online']?.['date-parts']?.[0]?.[0]) {
    year = cr['published-online']['date-parts'][0][0];
  }

  let type: Publication['type'] = 'journal';
  if (cr.type === 'proceedings-article') type = 'conference';
  else if (cr.type === 'book-chapter') type = 'book-chapter';
  else if (cr.type === 'book') type = 'book';

  return {
    type,
    title: Array.isArray(cr.title) ? cr.title[0] : cr.title,
    authors,
    year,
    journal: cr['container-title']?.[0],
    volume: cr.volume,
    issue: cr.issue,
    pages: cr.page,
    doi: cr.DOI,
    url: cr.URL,
    publisher: cr.publisher,
    _source: 'crossref',
    _raw: raw,
  };
}

// ============================================================
// OLLAMA PARSING
// ============================================================

const OLLAMA_PROMPT = `Parse this academic citation. Extract the fields and return ONLY valid JSON.

EXAMPLE INPUT:
"(1) Hirokazu Takahashi, Tomoyo Shiramatsu: "Neural mechanisms of auditory perception." Journal of Neuroscience 45(3): pp. 123-145, 2020"

EXAMPLE OUTPUT:
{"authors":["Hirokazu Takahashi","Tomoyo Shiramatsu"],"title":"Neural mechanisms of auditory perception","journal":"Journal of Neuroscience","volume":"45","issue":"3","pages":"123-145","year":2020,"type":"journal"}

NOW PARSE THIS:
{citation}

RULES:
- authors: Extract ALL author names as an array (Japanese names like 高橋宏知 are fine)
- title: The paper title ONLY (usually in quotes or after colon)
- year: 4-digit number
- type: one of journal/conference/book/review/presentation

Return ONLY the JSON object, nothing else:`;

// Fallback: extract authors from raw text using patterns
function extractAuthorsFromRaw(text: string): string[] {
  // Pattern 1: Names before colon (e.g., "Name1, Name2: Title")
  const colonMatch = text.match(/^\s*\(\d+\)\s*(.+?)[:：][\s]*[「"]/);
  if (colonMatch) {
    return colonMatch[1]
      .split(/[,，、and]+/)
      .map(n => n.trim())
      .filter(n => n.length > 1 && n.length < 30);
  }

  // Pattern 2: Japanese names (e.g., 高橋宏知，白松知世)
  const jaMatch = text.match(/^\s*\(\d+\)\s*([^:：「"]+)/);
  if (jaMatch) {
    return jaMatch[1]
      .split(/[,，、]+/)
      .map(n => n.trim())
      .filter(n => n.length > 1 && n.length < 20 && !n.match(/^\d/));
  }

  return [];
}

// Fallback: extract title from raw text
function extractTitleFromRaw(text: string): string {
  // Pattern 1: Title in quotes 「」or ""
  const quoteMatch = text.match(/[「"]([^」"]+)[」"]/);
  if (quoteMatch) return quoteMatch[1];

  // Pattern 2: After colon
  const colonMatch = text.match(/[:：]\s*[「"]?([^」"，,]+)/);
  if (colonMatch) return colonMatch[1].trim();

  return '';
}

// Fallback: extract year from raw text
function extractYearFromRaw(text: string): number | null {
  const match = text.match(/[,，\s](\d{4})[年\s,，\)）]/);
  return match ? parseInt(match[1]) : null;
}

async function parseWithOllama(citation: string): Promise<Partial<Publication> | null> {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: OLLAMA_PROMPT.replace('{citation}', citation),
        stream: false,
        options: { temperature: 0.1 }
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    let text = data.response || '';

    // Strip thinking tags if present (qwen3 models)
    if (text.includes('</think>')) {
      text = text.split('</think>').pop() || text;
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback to regex extraction
      return {
        title: extractTitleFromRaw(citation),
        authors: extractAuthorsFromRaw(citation),
        year: extractYearFromRaw(citation),
        type: 'journal',
        _source: 'ollama',
        _raw: citation,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Use LLM results but fall back to regex if authors empty
    let authors = Array.isArray(parsed.authors) ? parsed.authors : [];
    if (authors.length === 0) {
      authors = extractAuthorsFromRaw(citation);
    }

    // Use LLM title but fall back if it looks like full citation
    let title = parsed.title || '';
    if (title.length > 150 || title.includes('Proceedings') || title.match(/^\(\d+\)/)) {
      const extracted = extractTitleFromRaw(citation);
      if (extracted) title = extracted;
    }

    return {
      title,
      authors,
      year: typeof parsed.year === 'number' ? parsed.year : extractYearFromRaw(citation),
      journal: parsed.journal,
      conference: parsed.conference,
      volume: parsed.volume?.toString(),
      issue: parsed.issue?.toString(),
      pages: parsed.pages,
      type: parsed.type || 'journal',
      _source: 'ollama',
      _raw: citation,
    };
  } catch (e) {
    console.error('Ollama error:', e);
    // Return regex-based fallback instead of null
    return {
      title: extractTitleFromRaw(citation),
      authors: extractAuthorsFromRaw(citation),
      year: extractYearFromRaw(citation),
      type: 'journal',
      _source: 'ollama',
      _raw: citation,
    };
  }
}

// ============================================================
// UTILITIES
// ============================================================

function detectLanguage(text: string): 'ja' | 'en' {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text) ? 'ja' : 'en';
}

function extractAwards(text: string): string[] {
  const matches = text.match(/\[([^\]]+)\]/g);
  if (!matches) return [];
  return matches
    .map(m => m.slice(1, -1))
    .filter(a => !a.match(/^\d+$/) && a.length > 1);
}

function generateId(pub: Partial<Publication>, index: number): string {
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

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ============================================================
// MAIN
// ============================================================

interface Progress {
  completedBatches: string[];
  stats: {
    total: number;
    fromCrossRef: number;
    fromOllama: number;
    valid: number;
    invalid: number;
  };
}

function loadProgress(): Progress {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return {
    completedBatches: [],
    stats: { total: 0, fromCrossRef: 0, fromOllama: 0, valid: 0, invalid: 0 }
  };
}

function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function main() {
  console.log('============================================================');
  console.log('Smart Publication Parser');
  console.log('============================================================\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load cache and progress
  loadCache();
  const progress = loadProgress();

  console.log(`CrossRef cache: ${Object.keys(crossrefCache).length} entries`);
  console.log(`Completed batches: ${progress.completedBatches.length}\n`);

  // Get batch files
  const batchFiles = fs.readdirSync(BATCHES_DIR)
    .filter(f => f.match(/^batch-\d+\.json$/))
    .sort();

  const remainingBatches = batchFiles.filter(f => !progress.completedBatches.includes(f));
  console.log(`Total batches: ${batchFiles.length}`);
  console.log(`Remaining: ${remainingBatches.length}\n`);

  if (remainingBatches.length === 0) {
    console.log('All batches completed!');
    return;
  }

  // Process each batch
  for (const batchFile of remainingBatches) {
    const batch = JSON.parse(fs.readFileSync(path.join(BATCHES_DIR, batchFile), 'utf-8'));
    const batchNum = parseInt(batchFile.match(/\d+/)?.[0] || '0');

    console.log(`\n[${batchNum + 1}/${batchFiles.length}] ${batchFile} (${batch.category}, ${batch.items.length} items)`);

    const results: Publication[] = [];

    for (let i = 0; i < batch.items.length; i++) {
      const raw = typeof batch.items[i] === 'string' ? batch.items[i] : batch.items[i].raw;
      const doi = extractDoi(raw);
      const arxiv = extractArxiv(raw);

      let pub: Partial<Publication> | null = null;
      let source = '';

      // Strategy 1: Try category-specific regex parser FIRST (fast, accurate)
      const regexResult = parseByCategory(raw, batch.category);
      if (regexResult && isRegexValid(regexResult)) {
        pub = {
          type: regexResult.type as Publication['type'],
          title: regexResult.title,
          authors: regexResult.authors,
          year: regexResult.year,
          journal: regexResult.journal,
          conference: regexResult.conference,
          volume: regexResult.volume,
          issue: regexResult.issue,
          pages: regexResult.pages,
          doi: regexResult.doi || doi || undefined,
          publisher: regexResult.publisher,
          awards: regexResult.awards,
          _source: 'regex' as any,
          _raw: raw,
        };
        source = 'Regex';
        (progress.stats as any).fromRegex = ((progress.stats as any).fromRegex || 0) + 1;
      }

      // Strategy 2: If regex failed, try CrossRef if DOI found
      if (!pub && doi) {
        const cr = await fetchCrossRef(doi);
        if (cr) {
          pub = crossrefToPublication(cr, raw, batch.category);
          source = 'CrossRef';
          progress.stats.fromCrossRef++;
        }
        await sleep(100); // Rate limit
      }

      // Strategy 3: Fall back to Ollama LLM
      if (!pub) {
        pub = await parseWithOllama(raw);
        if (pub) {
          source = 'Ollama';
          progress.stats.fromOllama++;
        }
      }

      // If still no result, create minimal entry
      if (!pub) {
        pub = {
          title: raw.slice(0, 200),
          authors: [],
          year: null,
          type: 'journal',
          _source: 'ollama',
          _raw: raw,
        };
        source = 'Failed';
      }

      // Add metadata
      pub.language = detectLanguage(raw);
      pub.category = batch.category;
      pub.awards = extractAwards(raw);
      if (arxiv) pub.arxiv = arxiv;
      if (doi && !pub.doi) pub.doi = doi;

      // Validate
      const validation = validatePublication(pub);
      pub._valid = validation.valid;
      if (!validation.valid) {
        pub._errors = validation.errors;
        progress.stats.invalid++;
      } else {
        progress.stats.valid++;
      }

      // Generate ID
      pub.id = generateId(pub, progress.stats.total);
      progress.stats.total++;

      results.push(pub as Publication);

      // Progress indicator
      const validMark = validation.valid ? '✓' : '✗';
      process.stdout.write(`\r  ${i + 1}/${batch.items.length} [${source}] ${validMark}`);
    }

    // Save batch results
    const outputFile = path.join(OUTPUT_DIR, `${batchFile.replace('.json', '-parsed.json')}`);
    fs.writeFileSync(outputFile, JSON.stringify({
      batchId: batchNum,
      category: batch.category,
      categoryTitle: batch.categoryTitle,
      parsedAt: new Date().toISOString(),
      items: results,
    }, null, 2));

    // Update progress
    progress.completedBatches.push(batchFile);
    saveProgress(progress);
    saveCache();

    console.log(`\n  Saved: ${outputFile}`);
  }

  // Final summary
  console.log('\n============================================================');
  console.log('COMPLETED');
  console.log('============================================================');
  console.log(`Total processed: ${progress.stats.total}`);
  const fromRegex = (progress.stats as any).fromRegex || 0;
  console.log(`From Regex: ${fromRegex} (${(100 * fromRegex / progress.stats.total).toFixed(1)}%)`);
  console.log(`From CrossRef: ${progress.stats.fromCrossRef} (${(100 * progress.stats.fromCrossRef / progress.stats.total).toFixed(1)}%)`);
  console.log(`From Ollama: ${progress.stats.fromOllama} (${(100 * progress.stats.fromOllama / progress.stats.total).toFixed(1)}%)`);
  console.log(`Valid: ${progress.stats.valid}`);
  console.log(`Invalid (needs review): ${progress.stats.invalid}`);
}

main().catch(console.error);
