/**
 * Attach awards to papers
 *
 * Awards are embedded in publications.json as [Award Name] annotations.
 * This script extracts those and adds them to the corresponding YAML files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLICATIONS_DIR = path.join(__dirname, '..', 'content', 'publications');
const SOURCE_JSON = path.join(__dirname, '..', 'scraped', 'publications.json');

interface SourceCategory {
  id: string;
  title: string;
  items: string[];
}

interface PaperWithAward {
  number: number;
  title: string;
  awards: string[];
  raw: string;
}

function extractTitleFromRaw(raw: string): string {
  // Extract title from 「」or various quote styles
  const jpMatch = raw.match(/[「「]([^」」]+)[」」]/);
  if (jpMatch) return jpMatch[1];

  // Handle fancy curly quotes (used in English papers)
  // U+201C " and U+201D "
  const fancyQuoteMatch = raw.match(/[\u201c]([^\u201d]+)[\u201d]/);
  if (fancyQuoteMatch) return fancyQuoteMatch[1];

  // Handle straight quotes
  const enMatch = raw.match(/"([^"]+)"/);
  if (enMatch) return enMatch[1];

  return '';
}

function extractAwardsFromRaw(raw: string): string[] {
  const awards: string[] = [];

  // Match all [Award Name] patterns
  const awardMatches = raw.matchAll(/\[([^\]]*(?:賞|Award|Prize)[^\]]*)\]/gi);
  for (const match of awardMatches) {
    let award = match[1].trim();
    // Clean up the award name
    award = award.replace(/受賞$/, ''); // Remove trailing 受賞
    if (award.length > 3) {
      awards.push(award);
    }
  }

  return awards;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\s「」""''（）()\[\]【】・]/g, '')
    .slice(0, 25);
}

function findYamlFile(title: string, yamlFiles: Map<string, string>): string | null {
  const normalized = normalizeTitle(title);

  // Skip if title is too short (prevents false matches)
  if (normalized.length < 10) {
    return null;
  }

  for (const [key, filepath] of yamlFiles) {
    // Require at least 15 chars to match
    if (key.length < 10) continue;

    const searchLen = Math.min(20, normalized.length, key.length);
    if (key.slice(0, searchLen) === normalized.slice(0, searchLen)) {
      return filepath;
    }
  }

  return null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('============================================================');
  console.log(`ATTACH AWARDS TO PAPERS ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('============================================================\n');

  // Load source data
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf-8'));
  const categories: SourceCategory[] = sourceData.categories || [];

  // Build index of YAML files by normalized title
  const yamlFiles = new Map<string, string>();
  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));

  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(PUBLICATIONS_DIR, f), 'utf-8');
      const pub = yaml.parse(content);
      const key = normalizeTitle(pub.title || '');
      yamlFiles.set(key, path.join(PUBLICATIONS_DIR, f));
    } catch (e) {
      // Skip invalid files
    }
  }

  console.log(`YAML files indexed: ${yamlFiles.size}\n`);

  // Find all papers with awards
  const papersWithAwards: PaperWithAward[] = [];

  for (const category of categories) {
    for (let i = 0; i < category.items.length; i++) {
      const raw = category.items[i];
      const awards = extractAwardsFromRaw(raw);

      if (awards.length > 0) {
        const title = extractTitleFromRaw(raw);
        if (!title) {
          console.log(`WARNING: Could not extract title from: ${raw.slice(0, 80)}...`);
          console.log(`  Awards: ${awards.join(', ')}\n`);
        }
        papersWithAwards.push({
          number: i + 1,
          title,
          awards,
          raw: raw.slice(0, 100),
        });
      }
    }
  }

  console.log(`Papers with awards found: ${papersWithAwards.length}\n`);

  // Attach awards to YAML files
  let attached = 0;
  let notFound = 0;

  for (const paper of papersWithAwards) {
    const yamlPath = findYamlFile(paper.title, yamlFiles);

    if (!yamlPath) {
      console.log(`NOT FOUND: ${paper.title.slice(0, 40)}...`);
      console.log(`  Awards: ${paper.awards.join(', ')}`);
      notFound++;
      continue;
    }

    // Read and update YAML
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const pub = yaml.parse(content);

    // Merge awards (don't duplicate, normalize by removing 受賞 suffix)
    const existingAwards: string[] = pub.awards || [];

    // Normalize awards for comparison (remove 受賞 suffix)
    const normalizeAward = (a: string) => a.replace(/受賞$/, '').trim();
    const existingNormalized = existingAwards.map(normalizeAward);

    // Only add new awards that don't already exist (after normalization)
    const toAdd = paper.awards.filter(a => !existingNormalized.includes(normalizeAward(a)));

    // Keep existing awards as-is, add truly new ones
    const newAwards = [...existingAwards, ...toAdd];

    if (newAwards.length > existingAwards.length) {
      console.log(`ATTACHING to: ${path.basename(yamlPath)}`);
      console.log(`  Title: ${paper.title.slice(0, 40)}...`);
      console.log(`  Awards: ${paper.awards.join(', ')}`);

      if (!dryRun) {
        pub.awards = newAwards;
        fs.writeFileSync(yamlPath, yaml.stringify(pub));
      }
      attached++;
    }
  }

  console.log('\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`Papers with awards: ${papersWithAwards.length}`);
  console.log(`Awards attached:    ${attached}`);
  console.log(`Papers not found:   ${notFound}`);
}

main().catch(console.error);
