/**
 * Test category-specific parsers on 3 samples each
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
// Inline the parsers to avoid module issues
interface ParsedPublication {
  authors: string[];
  title: string;
  year: number | null;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  publisher?: string;
  conference?: string;
  location?: string;
  date?: string;
  awards?: string[];
  type: string;
}

function parseOriginalJa(raw: string): ParsedPublication | null {
  const authorsMatch = raw.match(/^\(\d+\)\s*([^:：]+)[:：]\s*「/);
  if (!authorsMatch) return null;
  const authors = authorsMatch[1].split(/[,，、]/).map(a => a.trim()).filter(a => a.length > 0);
  const titleMatch = raw.match(/「([^」]+)」/);
  if (!titleMatch) return null;
  const title = titleMatch[1];
  const journalMatch = raw.match(/」[,，]\s*([^0-9]+?)\s*(\d+)\s*\((\d+)\)/);
  const journal = journalMatch ? journalMatch[1].trim() : undefined;
  const volume = journalMatch ? journalMatch[2] : undefined;
  const issue = journalMatch ? journalMatch[3] : undefined;
  const pagesMatch = raw.match(/pp?\.\s*([0-9]+-[0-9]+)/);
  const pages = pagesMatch ? pagesMatch[1] : undefined;
  // Fixed: year can appear anywhere, look for 4 digits followed by space, (, or end
  const yearMatch = raw.match(/[,，:\s]((?:19|20)\d{2})(?:\s|\(|$|doi|\[)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  const doiMatch = raw.match(/doi[:\s]*([0-9.]+\/[^\s\)]+)/i);
  const doi = doiMatch ? doiMatch[1] : undefined;
  return { authors, title, year, journal, volume, issue, pages, doi, type: 'journal' };
}

function parseOriginalEn(raw: string): ParsedPublication | null {
  // Handle both straight quotes "" and curly quotes "" (use Unicode escapes)
  const authorsMatch = raw.match(/^\(\d+\)\s*([^:]+):\s*["\u201c]/);
  if (!authorsMatch) return null;
  const authorsRaw = authorsMatch[1];
  const authors = authorsRaw.split(/,\s*(?:and\s+)?/).map(a => a.trim()).filter(a => a.length > 0 && !a.match(/^\d/));

  // Match title in either straight or curly quotes (use Unicode escapes)
  const titleMatch = raw.match(/["\u201c]([^"\u201c\u201d]+)["\u201d]/);
  if (!titleMatch) return null;
  const title = titleMatch[1].replace(/\.$/, '');

  // Journal after closing quote
  const journalMatch = raw.match(/[""]\s+([A-Za-z][^0-9]+?)\s+(\d+)\s*\((\d+)\)/);
  const journal = journalMatch ? journalMatch[1].trim() : undefined;
  const volume = journalMatch ? journalMatch[2] : undefined;
  const issue = journalMatch ? journalMatch[3] : undefined;
  const pagesMatch = raw.match(/pp?\.?\s*([0-9]+-[0-9]+)/);
  const pages = pagesMatch ? pagesMatch[1] : undefined;
  const yearMatch = raw.match(/[,:\s]\s*((?:19|20)\d{2})\s*(?:\(|$|doi)/i);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  const doiMatch = raw.match(/doi[:\s]*([0-9.]+\/[^\s\)]+)/i);
  const doi = doiMatch ? doiMatch[1] : undefined;
  return { authors, title, year, journal, volume, issue, pages, doi, type: 'journal' };
}

function parseConference(raw: string): ParsedPublication | null {
  // Handle both straight quotes "" and curly quotes "" (use Unicode escapes)
  const authorsMatch = raw.match(/^\(\d+\)\s*([^:]+):\s*["\u201c]/);
  if (!authorsMatch) return null;
  const authorsRaw = authorsMatch[1];
  const authors = authorsRaw.split(/,\s*(?:and\s+)?/).map(a => a.trim()).filter(a => a.length > 0 && !a.match(/^\d/));

  const titleMatch = raw.match(/["\u201c]([^"\u201c\u201d]+)["\u201d]/);
  if (!titleMatch) return null;
  const title = titleMatch[1].replace(/\.$/, '');

  // Conference name after closing quote
  const confMatch = raw.match(/["\u201d]\s+(Proceedings[^:]+)/i);
  const conference = confMatch ? confMatch[1].trim() : undefined;
  const pagesMatch = raw.match(/pp?\.?\s*([0-9]+(?:-[0-9]+)?)/);
  const pages = pagesMatch ? pagesMatch[1] : undefined;
  // Year from (Location, Year年Month月Day日) pattern
  const yearMatch = raw.match(/[,\s]((?:19|20)\d{2})年?\d*月?\d*日?\)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  // Location before year
  const locMatch = raw.match(/\(([^,，]+)[,，]\s*(?:19|20)\d{2}/);
  const location = locMatch ? locMatch[1].trim() : undefined;
  const awardMatch = raw.match(/\[([^\]]+)\]/);
  const awards = awardMatch ? [awardMatch[1]] : undefined;
  return { authors, title, year, conference, pages, location, awards, type: 'conference' };
}

function parseReview(raw: string): ParsedPublication | null {
  const result = parseOriginalJa(raw);
  if (result) {
    result.type = 'review';
    const invitedMatch = raw.match(/\[(招待論文|invited)\]/i);
    if (invitedMatch) result.awards = [invitedMatch[1]];
  }
  return result;
}

function parseBook(raw: string): ParsedPublication | null {
  const authorsMatch = raw.match(/^\(\d+\)\s*([^:：]+)[:：]\s*「/);
  if (!authorsMatch) return null;
  const authors = authorsMatch[1].split(/[,，、]/).map(a => a.trim()).filter(a => a.length > 0);
  const titleMatch = raw.match(/「([^」]+)」/);
  if (!titleMatch) return null;
  const title = titleMatch[1];
  const pubMatch = raw.match(/」[，,]\s*([^，,]+?)[，,]\s*(?:東京|大阪|京都)/);
  const publisher = pubMatch ? pubMatch[1] : undefined;
  const yearMatch = raw.match(/((?:19|20)\d{2})年?\s*(?:\(|$)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  return { authors, title, year, publisher, type: 'book' };
}

function parseOral(raw: string): ParsedPublication | null {
  // Handle Japanese (：「」), English straight (""), and English curly ("") quotes - use Unicode escapes
  const authorsMatch = raw.match(/^\(\d+\)\s*([^:：「"\u201c]+)[:：]\s*[「"\u201c]/);
  if (!authorsMatch) return null;
  const authors = authorsMatch[1].split(/[,，、]\s*(?:and\s+)?/).map(a => a.trim()).filter(a => a.length > 0);

  // Match 「」, "", or "" (use Unicode escapes for curly quotes)
  const titleMatch = raw.match(/[「"\u201c]([^」"\u201c\u201d]+)[」"\u201d]/);
  if (!titleMatch) return null;
  const title = titleMatch[1].replace(/\.$/, '');

  // Event after closing quote (handle all quote types)
  const eventMatch = raw.match(/[」"\u201d][，,.\s]+([^(（]+)/);
  const conference = eventMatch ? eventMatch[1].trim() : undefined;

  // Year: handle both 2018年 and , 2018
  const yearMatch = raw.match(/((?:19|20)\d{2})年?\d*月?\d*日?[,\s]*\)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Location in parentheses
  const locMatch = raw.match(/\(([^，,\d]+)[，,]/);
  const location = locMatch ? locMatch[1].trim() : undefined;

  // Awards/keynote
  const keyMatch = raw.match(/\[([^\]]+)\]/i);
  const awards = keyMatch ? [keyMatch[1]] : undefined;

  return { authors, title, year, conference, location, awards, type: 'presentation' };
}

function parseSeminars(raw: string): ParsedPublication | null {
  return parseOral(raw);
}

function parseByCategory(raw: string, category: string): ParsedPublication | null {
  switch (category) {
    case 'original_ja': return parseOriginalJa(raw);
    case 'original_en': return parseOriginalEn(raw);
    case 'conference': return parseConference(raw);
    case 'review': return parseReview(raw);
    case 'book': return parseBook(raw);
    case 'oral': return parseOral(raw);
    case 'seminars': return parseSeminars(raw);
    default: return null;
  }
}

function isValid(pub: ParsedPublication | null): boolean {
  if (!pub) return false;
  if (!pub.authors || pub.authors.length === 0) return false;
  if (!pub.title || pub.title.length === 0) return false;
  return true;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCHES_DIR = path.join(__dirname, '..', 'scraped', 'batches');

const testCases = [
  { file: 'batch-000.json', category: 'original_ja' },
  { file: 'batch-002.json', category: 'original_en' },
  { file: 'batch-006.json', category: 'conference' },
  { file: 'batch-008.json', category: 'review' },
  { file: 'batch-011.json', category: 'book' },
  { file: 'batch-012.json', category: 'oral' },
  { file: 'batch-017.json', category: 'seminars' },
];

let totalTests = 0;
let passed = 0;

for (const tc of testCases) {
  const batchPath = path.join(BATCHES_DIR, tc.file);
  if (!fs.existsSync(batchPath)) {
    console.log(`[${tc.category}] File not found: ${tc.file}`);
    continue;
  }

  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  console.log(`\n=== ${tc.category.toUpperCase()} ===`);

  for (let i = 0; i < Math.min(3, batch.items.length); i++) {
    const raw = batch.items[i];
    totalTests++;

    const result = parseByCategory(raw, tc.category);
    const valid = isValid(result);

    if (valid) {
      passed++;
      console.log(`${i + 1}. ✓ VALID`);
      console.log(`   Authors: ${result!.authors.slice(0, 2).join(', ')}${result!.authors.length > 2 ? '...' : ''}`);
      console.log(`   Title: ${result!.title.substring(0, 50)}...`);
      console.log(`   Year: ${result!.year}`);
    } else {
      console.log(`${i + 1}. ✗ INVALID`);
      console.log(`   Raw: ${raw.substring(0, 80)}...`);
      if (result) {
        console.log(`   Got: authors=${result.authors?.length || 0}, title=${!!result.title}, year=${result.year}`);
      }
    }
  }
}

console.log('\n' + '='.repeat(50));
console.log(`RESULTS: ${passed}/${totalTests} passed (${(100 * passed / totalTests).toFixed(0)}%)`);
