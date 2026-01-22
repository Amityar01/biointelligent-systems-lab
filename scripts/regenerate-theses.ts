/**
 * Regenerate ALL thesis entries from original scraped data
 * - Creates thesis YAML files from thesiss-all.json
 * - Ensures 100% coverage of original site thesis data
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLICATIONS_DIR = path.join(__dirname, '..', 'content', 'publications');
const THESIS_JSON = path.join(__dirname, '..', 'scraped', 'parsed', 'thesiss-all.json');

interface ThesisEntry {
  title?: string | { ja?: string; en?: string };
  authors?: string[];
  year?: number;
  institution?: string;
  _raw?: string;
}

function extractTitle(entry: ThesisEntry): string {
  const raw = entry._raw || '';

  // Try to extract title from 「」brackets
  const match = raw.match(/[「「]([^」」]+)[」」]/);
  if (match) {
    return match[1];
  }

  // Fall back to title field
  if (typeof entry.title === 'string') {
    return entry.title.split(/[,，]/)[0].replace(/[「」]/g, '');
  }
  if (entry.title?.ja) {
    return entry.title.ja;
  }
  if (entry.title?.en) {
    return entry.title.en;
  }

  return raw.slice(0, 50);
}

function extractInstitution(raw: string): string {
  // Extract institution info like "東京大学工学部卒業論文, 2000年2月"
  const patterns = [
    /[」」][,，]\s*([^(（]+(?:卒業論文|修士論文|博士論文|学位論文)[^(（]*)/,
    /(東京大学[^(（]+(?:卒業論文|修士論文|博士論文|学位論文)[^(（]*)/,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

function extractYear(raw: string): number | undefined {
  // Try various year patterns
  const patterns = [
    /(\d{4})年/,
    /(\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      if (year >= 1990 && year <= 2030) {
        return year;
      }
    }
  }

  return undefined;
}

function extractAuthors(raw: string): string[] {
  // Authors often appear before the title in 「」
  // Format: "AuthorName：「Title」" or just listed at start

  const authors: string[] = [];

  // Try pattern: name before 「
  const beforeTitle = raw.split(/[「「]/)[0];
  if (beforeTitle) {
    // Split by common delimiters
    const parts = beforeTitle.split(/[,，・、]/);
    for (const part of parts) {
      const cleaned = part.trim();
      // Valid author: 2+ chars, contains Japanese or proper English name
      if (cleaned.length >= 2 &&
          (/[\u3040-\u9fff]/.test(cleaned) || /^[A-Z][a-z]+ [A-Z]/.test(cleaned)) &&
          !/論文|東京大学|指導|年|月/.test(cleaned)) {
        authors.push(cleaned);
      }
    }
  }

  return authors;
}

function getThesisType(raw: string): string {
  if (/博士論文/.test(raw)) return 'doctoral';
  if (/修士論文/.test(raw)) return 'masters';
  if (/卒業論文/.test(raw)) return 'undergraduate';
  if (/学位論文/.test(raw)) return 'doctoral'; // 学位論文 usually means doctoral
  return 'thesis';
}

function createSlug(title: string, year?: number): string {
  // Create a filename-safe slug
  const yearStr = year || 'unknown';
  const titleSlug = title
    .toLowerCase()
    .replace(/[^\w\u3040-\u9fff]+/g, '-')
    .slice(0, 40)
    .replace(/-+$/, '');

  return `${yearStr}-thesis-${titleSlug}`;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('============================================================');
  console.log(`Regenerate Theses from Original Data ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('============================================================\n');

  // Load original thesis data
  const thesisData = JSON.parse(fs.readFileSync(THESIS_JSON, 'utf-8'));
  const originalTheses: ThesisEntry[] = thesisData.items || [];

  console.log(`Original thesis entries: ${originalTheses.length}\n`);

  // Get existing thesis files to avoid duplicates
  const existingTitles = new Set<string>();
  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));

  for (const f of files) {
    const content = fs.readFileSync(path.join(PUBLICATIONS_DIR, f), 'utf-8');
    const pub = yaml.parse(content);
    if (pub.type === 'thesis') {
      const normTitle = (pub.title || '').toLowerCase().replace(/\s+/g, '').slice(0, 30);
      existingTitles.add(normTitle);
    }
  }

  console.log(`Existing thesis files: ${existingTitles.size}\n`);

  let created = 0;
  let skipped = 0;

  for (const entry of originalTheses) {
    const raw = entry._raw || '';
    const title = extractTitle(entry);
    const normTitle = title.toLowerCase().replace(/\s+/g, '').slice(0, 30);

    // Skip if already exists
    if (existingTitles.has(normTitle)) {
      skipped++;
      continue;
    }

    const year = extractYear(raw);
    const institution = extractInstitution(raw);
    const authors = extractAuthors(raw);
    const thesisType = getThesisType(raw);

    const slug = createSlug(title, year);
    const filename = `${slug}-${created + 1000}.yaml`;

    const pub = {
      id: `thesis-${created + 1000}`,
      title: title,
      authors: authors.length > 0 ? authors : ['Unknown'],
      year: year,
      type: 'thesis',
      thesisType: thesisType,
      institution: institution || undefined,
      tags: ['japanese'],
    };

    // Remove undefined fields
    Object.keys(pub).forEach(key => {
      if (pub[key as keyof typeof pub] === undefined) {
        delete pub[key as keyof typeof pub];
      }
    });

    console.log(`Creating: ${filename}`);
    console.log(`  Title: ${title.slice(0, 50)}...`);
    console.log(`  Type: ${thesisType}`);
    if (institution) console.log(`  Institution: ${institution.slice(0, 40)}...`);

    if (!dryRun) {
      fs.writeFileSync(
        path.join(PUBLICATIONS_DIR, filename),
        yaml.stringify(pub)
      );
    }

    existingTitles.add(normTitle);
    created++;
    console.log('');
  }

  console.log('============================================================');
  console.log('REGENERATION COMPLETE');
  console.log('============================================================');
  console.log(`Original entries: ${originalTheses.length}`);
  console.log(`Already existed:  ${skipped}`);
  console.log(`Newly created:    ${created}`);
  console.log(`Total theses:     ${existingTitles.size}`);
}

main().catch(console.error);
