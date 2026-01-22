/**
 * Verify 100% data coverage from original site
 * Compares all parsed JSON files against current YAML files
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSED_DIR = path.join(__dirname, '..', 'scraped', 'parsed');
const PUBLICATIONS_DIR = path.join(__dirname, '..', 'content', 'publications');

function normalize(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/[「」""''「」（）()\s]/g, '')
    .slice(0, 35);
}

async function main() {
  console.log('============================================================');
  console.log('VERIFY 100% DATA COVERAGE');
  console.log('============================================================\n');

  // Load all current YAML titles
  const yamlTitles = new Set<string>();
  const yamlFiles = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));

  for (const f of yamlFiles) {
    const content = fs.readFileSync(path.join(PUBLICATIONS_DIR, f), 'utf-8');
    const pub = yaml.parse(content);
    yamlTitles.add(normalize(pub.title));
  }

  console.log(`Current YAML files: ${yamlFiles.length}\n`);

  // Check each parsed JSON file
  const jsonFiles = fs.readdirSync(PARSED_DIR).filter(f => f.endsWith('.json'));

  const results: Array<{
    file: string;
    total: number;
    found: number;
    missing: number;
  }> = [];

  let totalOriginal = 0;
  let totalFound = 0;
  let totalMissing = 0;

  for (const jsonFile of jsonFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(PARSED_DIR, jsonFile), 'utf-8'));
      const items = data.items || [];

      if (items.length === 0) continue;

      let found = 0;
      let missing = 0;
      const missingTitles: string[] = [];

      for (const item of items) {
        const title = item.title?.ja || item.title?.en || item.title || '';
        const norm = normalize(title);

        if (yamlTitles.has(norm)) {
          found++;
        } else {
          missing++;
          if (missingTitles.length < 3) {
            missingTitles.push(title.slice(0, 50));
          }
        }
      }

      results.push({
        file: jsonFile,
        total: items.length,
        found,
        missing,
      });

      totalOriginal += items.length;
      totalFound += found;
      totalMissing += missing;

      const pct = ((found / items.length) * 100).toFixed(1);
      const status = missing === 0 ? '✓' : missing <= 3 ? '~' : '✗';

      console.log(`${status} ${jsonFile}`);
      console.log(`  Total: ${items.length}, Found: ${found}, Missing: ${missing} (${pct}%)`);

      if (missing > 0 && missingTitles.length > 0) {
        console.log(`  Missing examples:`);
        missingTitles.forEach(t => console.log(`    - ${t}...`));
      }
      console.log('');
    } catch (e) {
      // Skip invalid JSON files
    }
  }

  console.log('============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`Total original entries: ${totalOriginal}`);
  console.log(`Found in YAML:          ${totalFound}`);
  console.log(`Missing:                ${totalMissing}`);
  console.log(`Coverage:               ${((totalFound / totalOriginal) * 100).toFixed(1)}%`);
  console.log('');
  console.log(`Current YAML files:     ${yamlFiles.length}`);

  // Note: totalFound may be > yamlFiles.length due to duplicates in original data
}

main().catch(console.error);
