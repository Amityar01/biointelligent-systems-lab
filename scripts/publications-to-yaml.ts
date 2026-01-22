/**
 * Convert parsed publications JSON to individual YAML files
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSED_DIR = path.join(__dirname, '..', 'scraped', 'parsed');
const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'publications');

interface ParsedPublication {
  id: string;
  type: string;
  title: string;
  authors: string[];
  year: number | null;
  journal?: string;
  conference?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  publisher?: string;
  awards?: string[];
  language: 'ja' | 'en';
  category: string;
  _source: string;
  _raw: string;
  _valid: boolean;
  _errors?: string[];
}

function generateFilename(pub: ParsedPublication, index: number): string {
  const year = pub.year || 'unknown';
  const firstAuthor = (pub.authors?.[0] || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u9fff]/gi, '')
    .slice(0, 10);
  const titleSlug = (pub.title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u9fff]+/gi, '-')
    .slice(0, 25)
    .replace(/-+$/, '');
  return `${year}-${firstAuthor}-${titleSlug}-${index}.yaml`;
}

function pubToYaml(pub: ParsedPublication): string {
  const obj: Record<string, any> = {
    id: pub.id,
    title: pub.title,
    authors: pub.authors,
  };

  // Add venue (journal or conference) - skip if "None" or empty
  if (pub.journal && pub.journal !== 'None' && pub.journal.trim()) {
    obj.journal = pub.journal;
  }
  if (pub.conference && pub.conference !== 'None' && pub.conference.trim()) {
    obj.conference = pub.conference;
  }

  // Add year
  if (pub.year) obj.year = pub.year;

  // Add type - normalize based on category
  obj.type = normalizeType(pub.type, pub.category);

  // Add optional fields - skip if "None" or empty
  if (pub.volume && pub.volume !== 'None') obj.volume = pub.volume;
  if (pub.issue && pub.issue !== 'None') obj.issue = pub.issue;
  if (pub.pages && pub.pages !== 'None') obj.pages = pub.pages;
  if (pub.doi && pub.doi !== 'None') obj.doi = pub.doi;
  if (pub.publisher && pub.publisher !== 'None') obj.publisher = pub.publisher;
  if (pub.awards && pub.awards.length > 0) obj.awards = pub.awards;

  // Add tags based on language and category
  const tags: string[] = [];
  if (pub.language === 'ja') tags.push('japanese');
  if (pub.language === 'en') tags.push('english');
  if (obj.tags && obj.tags.length > 0) {
    obj.tags = tags;
  } else if (tags.length > 0) {
    obj.tags = tags;
  }

  return yaml.stringify(obj);
}

function normalizeType(type: string | undefined, category: string): string {
  // Map category to type FIRST - category is more reliable than LLM-assigned type
  const categoryLower = category?.toLowerCase() || '';

  // Direct category mappings take priority
  if (categoryLower === 'thesis') return 'thesis';
  if (categoryLower === 'conference') return 'conference';
  if (categoryLower === 'book') return 'book';
  if (categoryLower === 'review') return 'review';
  if (categoryLower === 'oral' || categoryLower === 'seminars') return 'presentation';
  if (categoryLower === 'poster') return 'poster';
  if (categoryLower === 'report') return 'report';
  if (categoryLower === 'patent') return 'patent';
  if (categoryLower === 'award') return 'award';
  if (categoryLower === 'grant') return 'grant';
  if (categoryLower === 'media') return 'media';
  if (categoryLower === 'original_ja' || categoryLower === 'original_en') return 'journal';

  // Normalize arXiv to preprint
  if (type?.toLowerCase() === 'arxiv') return 'preprint';

  return type || 'journal';
}

async function main() {
  console.log('Converting parsed publications to YAML...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get existing files to avoid duplicates
  const existingFiles = new Set(fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.yaml')));
  console.log(`Existing YAML files: ${existingFiles.size}`);

  // Get parsed batch files
  const batchFiles = fs.readdirSync(PARSED_DIR)
    .filter(f => f.match(/^batch-\d+-parsed\.json$/))
    .sort();

  console.log(`Parsed batches: ${batchFiles.length}\n`);

  let totalConverted = 0;
  let totalSkipped = 0;
  let totalInvalid = 0;

  for (const batchFile of batchFiles) {
    const batchPath = path.join(PARSED_DIR, batchFile);
    const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

    let batchConverted = 0;
    let batchSkipped = 0;

    for (let i = 0; i < batch.items.length; i++) {
      const pub = batch.items[i] as ParsedPublication;

      // Skip invalid publications
      if (!pub._valid) {
        totalInvalid++;
        continue;
      }

      // Skip if missing required fields
      if (!pub.title || !pub.authors || pub.authors.length === 0) {
        totalInvalid++;
        continue;
      }

      // Generate filename
      const filename = generateFilename(pub, totalConverted);

      // Check for duplicates by title similarity (simple check)
      const yamlContent = pubToYaml(pub);

      // Write file
      const outputPath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(outputPath, yamlContent);
      batchConverted++;
      totalConverted++;
    }

    console.log(`[${batchFile}] ${batch.category}: ${batchConverted} converted`);
  }

  console.log('\n============================================================');
  console.log('CONVERSION COMPLETE');
  console.log('============================================================');
  console.log(`Total converted: ${totalConverted}`);
  console.log(`Total invalid (skipped): ${totalInvalid}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

main().catch(console.error);
