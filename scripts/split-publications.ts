/**
 * Split publications into batches for parallel parsing
 * Run: npx ts-node scripts/split-publications.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRAPED_DIR = path.join(__dirname, '..', 'scraped');
const BATCHES_DIR = path.join(SCRAPED_DIR, 'batches');

// Create batches directory
if (!fs.existsSync(BATCHES_DIR)) {
  fs.mkdirSync(BATCHES_DIR, { recursive: true });
}

// Read publications
const pubData = JSON.parse(fs.readFileSync(path.join(SCRAPED_DIR, 'publications.json'), 'utf-8'));

const BATCH_SIZE = 25; // Items per batch

let batchNum = 0;
const manifest: { batch: string; category: string; count: number; file: string }[] = [];

for (const category of pubData.categories) {
  const items = category.items;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batchItems = items.slice(i, i + BATCH_SIZE);
    const batchFile = `batch-${String(batchNum).padStart(3, '0')}.json`;

    const batchData = {
      batchId: batchNum,
      category: category.id,
      categoryTitle: category.title,
      startIndex: i,
      items: batchItems
    };

    fs.writeFileSync(path.join(BATCHES_DIR, batchFile), JSON.stringify(batchData, null, 2));

    manifest.push({
      batch: batchFile,
      category: category.id,
      count: batchItems.length,
      file: batchFile
    });

    batchNum++;
  }
}

// Save manifest
fs.writeFileSync(path.join(BATCHES_DIR, 'manifest.json'), JSON.stringify({
  totalBatches: batchNum,
  totalItems: pubData.categories.reduce((sum: number, c: any) => sum + c.items.length, 0),
  batches: manifest
}, null, 2));

console.log(`Created ${batchNum} batches in ${BATCHES_DIR}`);
console.log(`Total items: ${manifest.reduce((sum, b) => sum + b.count, 0)}`);

// Also create the output directory
const PARSED_DIR = path.join(SCRAPED_DIR, 'parsed');
if (!fs.existsSync(PARSED_DIR)) {
  fs.mkdirSync(PARSED_DIR, { recursive: true });
}
console.log(`Output directory: ${PARSED_DIR}`);
