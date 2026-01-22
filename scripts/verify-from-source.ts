/**
 * Verify YAML files against the source of truth: publications.json
 * This is the original scraped data from the old site.
 *
 * Usage: npx tsx scripts/verify-from-source.ts [category]
 *
 * Categories: original_ja, original_en, reviews_ja, reviews_en,
 *             books_ja, books_en, conference, presentations,
 *             awards, grants, theses, media
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
  itemCount: number;
  items: string[];
}

interface VerifyResult {
  categoryId: string;
  categoryTitle: string;
  sourceCount: number;
  matchedCount: number;
  missingItems: Array<{number: number; title: string; hasAward: boolean; awardText?: string}>;
  awardsNotPreserved: Array<{number: number; title: string; award: string}>;
}

function extractTitleFromRaw(raw: string): string {
  // Extract title from 「」or ""
  const jpMatch = raw.match(/[「「]([^」」]+)[」」]/);
  if (jpMatch) return jpMatch[1];

  const enMatch = raw.match(/"([^"]+)"/);
  if (enMatch) return enMatch[1];

  // Fallback: take text after authors (after colon or ：)
  const colonMatch = raw.match(/[：:]\s*(.+?)(?:[,，]|$)/);
  if (colonMatch) return colonMatch[1].slice(0, 60);

  return raw.slice(0, 60);
}

function extractAwardFromRaw(raw: string): string | undefined {
  // Awards are in brackets like [平成21年電気学会...]
  const awardMatch = raw.match(/\[([^\]]*賞[^\]]*)\]/);
  if (awardMatch) return awardMatch[1];

  return undefined;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\s「」""''（）()\[\]【】]/g, '')
    .replace(/[0-9]/g, '')
    .slice(0, 25);
}

function loadYamlPublications(): Map<string, any> {
  const pubs = new Map();
  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));

  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(PUBLICATIONS_DIR, f), 'utf-8');
      const pub = yaml.parse(content);
      const key = normalizeTitle(pub.title || '');
      pubs.set(key, { ...pub, _file: f });
    } catch (e) {
      // Skip invalid files
    }
  }

  return pubs;
}

function verifyCategory(category: SourceCategory, yamlPubs: Map<string, any>): VerifyResult {
  const missingItems: VerifyResult['missingItems'] = [];
  const awardsNotPreserved: VerifyResult['awardsNotPreserved'] = [];
  let matchedCount = 0;

  for (let i = 0; i < category.items.length; i++) {
    const raw = category.items[i];
    const number = i + 1;
    const title = extractTitleFromRaw(raw);
    const award = extractAwardFromRaw(raw);
    const normalized = normalizeTitle(title);

    // Try to find in YAML
    let found = false;
    let yamlPub = null;

    for (const [key, pub] of yamlPubs) {
      if (key.includes(normalized.slice(0, 15)) || normalized.includes(key.slice(0, 15))) {
        found = true;
        yamlPub = pub;
        matchedCount++;
        break;
      }
    }

    if (!found) {
      missingItems.push({
        number,
        title: title.slice(0, 50),
        hasAward: !!award,
        awardText: award,
      });
    } else if (award) {
      // Check if award is preserved in YAML
      const yamlAwards = yamlPub.awards || [];
      const awardPreserved = yamlAwards.some((a: string) =>
        a.includes(award.slice(0, 10)) || award.includes(a.slice(0, 10))
      );

      if (!awardPreserved) {
        awardsNotPreserved.push({
          number,
          title: title.slice(0, 40),
          award,
        });
      }
    }
  }

  return {
    categoryId: category.id,
    categoryTitle: category.title,
    sourceCount: category.items.length,
    matchedCount,
    missingItems,
    awardsNotPreserved,
  };
}

async function main() {
  const targetCategory = process.argv[2];

  console.log('============================================================');
  console.log('VERIFY AGAINST SOURCE: publications.json');
  console.log('============================================================\n');

  // Load source data
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf-8'));
  const categories: SourceCategory[] = sourceData.categories || [];

  console.log(`Source categories: ${categories.length}`);
  categories.forEach(c => console.log(`  - ${c.id}: ${c.title} (${c.itemCount} items)`));
  console.log('');

  // Load YAML publications
  const yamlPubs = loadYamlPublications();
  console.log(`YAML publications loaded: ${yamlPubs.size}\n`);

  // Verify each category or specific one
  const toVerify = targetCategory
    ? categories.filter(c => c.id === targetCategory || c.title.includes(targetCategory))
    : categories;

  if (toVerify.length === 0) {
    console.log(`Category not found: ${targetCategory}`);
    console.log(`Available: ${categories.map(c => c.id).join(', ')}`);
    return;
  }

  const results: VerifyResult[] = [];

  for (const category of toVerify) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`CATEGORY: ${category.title} (${category.id})`);
    console.log(`${'='.repeat(60)}`);

    const result = verifyCategory(category, yamlPubs);
    results.push(result);

    console.log(`Source items: ${result.sourceCount}`);
    console.log(`Matched:      ${result.matchedCount}`);
    console.log(`Missing:      ${result.missingItems.length}`);
    console.log(`Awards lost:  ${result.awardsNotPreserved.length}`);

    if (result.missingItems.length > 0) {
      console.log(`\nMISSING ITEMS (first 5):`);
      result.missingItems.slice(0, 5).forEach(m => {
        console.log(`  (${m.number}) ${m.title}${m.hasAward ? ' [HAS AWARD!]' : ''}`);
      });
    }

    if (result.awardsNotPreserved.length > 0) {
      console.log(`\nAWARDS NOT PRESERVED:`);
      result.awardsNotPreserved.forEach(a => {
        console.log(`  (${a.number}) ${a.title}`);
        console.log(`         Award: ${a.award}`);
      });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(60)}`);

  let totalSource = 0;
  let totalMatched = 0;
  let totalMissing = 0;
  let totalAwardsLost = 0;

  for (const r of results) {
    const status = r.missingItems.length === 0 && r.awardsNotPreserved.length === 0 ? '✓' : '✗';
    console.log(`${status} ${r.categoryTitle}: ${r.matchedCount}/${r.sourceCount} matched, ${r.missingItems.length} missing, ${r.awardsNotPreserved.length} awards lost`);
    totalSource += r.sourceCount;
    totalMatched += r.matchedCount;
    totalMissing += r.missingItems.length;
    totalAwardsLost += r.awardsNotPreserved.length;
  }

  console.log(`\nTOTAL: ${totalMatched}/${totalSource} matched (${(totalMatched/totalSource*100).toFixed(1)}%)`);
  console.log(`Missing: ${totalMissing}`);
  console.log(`Awards lost: ${totalAwardsLost}`);
}

main().catch(console.error);
