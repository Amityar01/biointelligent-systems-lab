/**
 * Check for missing thesis data
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLICATIONS_DIR = path.join(__dirname, '..', 'content', 'publications');
const THESIS_JSON = path.join(__dirname, '..', 'scraped', 'parsed', 'thesiss-all.json');

function normalize(title: string): string {
  // Extract just the title part (between 「」 or before comma)
  let t = title || '';

  // If it starts with 「, extract content until 」
  const match = t.match(/[「「]([^」」]+)[」」]/);
  if (match) {
    t = match[1];
  } else {
    // Otherwise take part before first comma
    t = t.split(/[,，]/)[0];
  }

  return t
    .toLowerCase()
    .replace(/[\s「」""''（）()]/g, '')
    .slice(0, 40);
}

async function main() {
  // Load original thesis data
  const thesisData = JSON.parse(fs.readFileSync(THESIS_JSON, 'utf-8'));
  const originalTheses = thesisData.items || [];

  console.log('Original thesis entries:', originalTheses.length);

  // Get current publications
  const currentTheses = new Set<string>();
  const currentAll = new Map<string, { type: string; file: string; title: string }>();

  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));
  for (const f of files) {
    const content = fs.readFileSync(path.join(PUBLICATIONS_DIR, f), 'utf-8');
    const pub = yaml.parse(content);
    const norm = normalize(pub.title);
    currentAll.set(norm, { type: pub.type, file: f, title: pub.title });
    if (pub.type === 'thesis') {
      currentTheses.add(norm);
    }
  }

  console.log('Current thesis files:', currentTheses.size);

  // Find missing theses
  let missing = 0;
  let mergedAsOther = 0;
  const missingList: string[] = [];
  const mergedList: Array<{ original: string; current: string; type: string }> = [];

  for (const orig of originalTheses) {
    const title = orig.title?.ja || orig.title?.en || orig.title || '';
    const norm = normalize(title);

    if (!currentTheses.has(norm)) {
      // Check if it exists as another type
      const found = currentAll.get(norm);
      if (found) {
        mergedAsOther++;
        mergedList.push({
          original: title.slice(0, 50),
          current: found.title?.slice(0, 50) || '',
          type: found.type
        });
      } else {
        missing++;
        missingList.push(title.slice(0, 80));
      }
    }
  }

  console.log('\nTheses merged as other types:', mergedAsOther);
  console.log('Theses completely missing:', missing);

  if (mergedAsOther > 0) {
    console.log('\nTheses merged as other types (first 10):');
    mergedList.slice(0, 10).forEach(m => {
      console.log(`  "${m.original}..." → ${m.type}`);
    });
  }

  if (missing > 0) {
    console.log('\nCompletely missing theses (first 10):');
    missingList.slice(0, 10).forEach(t => console.log('  -', t));
  }

  // Summary
  console.log('\n============================================================');
  console.log('DATA COMPLETENESS SUMMARY');
  console.log('============================================================');
  console.log(`Original theses: ${originalTheses.length}`);
  console.log(`Current theses:  ${currentTheses.size}`);
  console.log(`Merged as other: ${mergedAsOther} (data preserved, type changed)`);
  console.log(`Missing:         ${missing} (data potentially lost)`);
  console.log(`Coverage:        ${((currentTheses.size + mergedAsOther) / originalTheses.length * 100).toFixed(1)}%`);
}

main().catch(console.error);
