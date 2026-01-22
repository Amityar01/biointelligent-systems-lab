import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../scraped/batches');

interface CategoryConfig {
  id: string;
  title: string;
  titleEn: string;
  startMarker: string;
  endMarker: string;
}

const MISSING_CATEGORIES: CategoryConfig[] = [
  {
    id: 'poster',
    title: 'ポスター発表 (Poster Presentation)',
    titleEn: 'Poster Presentation',
    startMarker: 'ポスター発表 (Poster Presentation)',
    endMarker: '紀要，成果報告書等'
  },
  {
    id: 'report',
    title: '紀要，成果報告書等 (Report)',
    titleEn: 'Report',
    startMarker: '紀要，成果報告書等 (Report)',
    endMarker: '創造的活動 (Creative Activity)'
  },
  {
    id: 'patent',
    title: '創造的活動 (Creative Activity)',
    titleEn: 'Creative Activity / Patents',
    startMarker: '創造的活動 (Creative Activity)',
    endMarker: '受賞 (Award)'
  },
  {
    id: 'award',
    title: '受賞 (Award)',
    titleEn: 'Award',
    startMarker: '受賞 (Award)',
    endMarker: '競争的資金 (grants)'
  },
  {
    id: 'grant',
    title: '競争的資金 (grants)',
    titleEn: 'Grants',
    startMarker: '競争的資金 (grants)',
    endMarker: 'メディア発表・取材協力等'
  },
  {
    id: 'media',
    title: 'メディア発表・取材協力等 (Media)',
    titleEn: 'Media',
    startMarker: 'メディア発表・取材協力等 (Media)',
    endMarker: '研究・論文指導 (mentoring)'
  },
  {
    id: 'thesis',
    title: '研究・論文指導 (mentoring)',
    titleEn: 'Mentoring / Theses',
    startMarker: '研究・論文指導 (mentoring)',
    endMarker: 'このページの先頭へ'
  }
];

async function main() {
  console.log('='.repeat(60));
  console.log('Scraping Missing Publication Categories');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('\nNavigating to pub.html...');
  await page.goto('https://www.ne.t.u-tokyo.ac.jp/pub.html', { waitUntil: 'networkidle2' });

  // Get full page text
  const fullText = await page.evaluate(() => document.body.innerText);

  // Find the next batch ID
  const existingBatches = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith('batch-') && f.endsWith('.json'));
  let nextBatchId = existingBatches.length;

  console.log(`\nStarting from batch ID: ${nextBatchId}`);

  for (const category of MISSING_CATEGORIES) {
    console.log(`\nExtracting: ${category.title}`);

    const startIdx = fullText.indexOf(category.startMarker);
    const endIdx = fullText.indexOf(category.endMarker);

    if (startIdx === -1) {
      console.log(`  Warning: Could not find start marker for ${category.id}`);
      continue;
    }

    const sectionText = fullText.substring(startIdx, endIdx !== -1 ? endIdx : fullText.length);

    // Extract numbered items - match (N) pattern followed by content until next (N) or end
    const items: string[] = [];
    const lines = sectionText.split('\n');
    let currentItem = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if line starts with (N) pattern
      const numMatch = trimmed.match(/^\((\d+)\)\s*/);
      if (numMatch) {
        // Save previous item if exists
        if (currentItem) {
          items.push(currentItem.trim());
        }
        currentItem = trimmed;
      } else if (currentItem) {
        // Continue previous item
        currentItem += ' ' + trimmed;
      }
    }
    // Don't forget last item
    if (currentItem) {
      items.push(currentItem.trim());
    }

    console.log(`  Found ${items.length} items`);

    if (items.length === 0) continue;

    // Split into batches of 25
    const BATCH_SIZE = 25;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batchItems = items.slice(i, i + BATCH_SIZE);
      const batchData = {
        batchId: nextBatchId,
        category: category.id,
        categoryTitle: category.title,
        categoryTitleEn: category.titleEn,
        startIndex: i,
        items: batchItems
      };

      const batchFile = path.join(OUTPUT_DIR, `batch-${String(nextBatchId).padStart(3, '0')}.json`);
      fs.writeFileSync(batchFile, JSON.stringify(batchData, null, 2), 'utf-8');
      console.log(`  Created: batch-${String(nextBatchId).padStart(3, '0')}.json (${batchItems.length} items)`);
      nextBatchId++;
    }
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('Missing categories scraping complete');
  console.log(`Total new batches created: ${nextBatchId - existingBatches.length}`);
}

main().catch(console.error);
