/**
 * Test CrossRef-first approach: extract DOIs from raw text, fetch metadata
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCHES_DIR = path.join(__dirname, '..', 'scraped', 'batches');

// Extract DOI from raw citation text
function extractDoi(text: string): string | null {
  // Match patterns like: (doi: 10.xxx), (DOI: 10.xxx), (10.xxx/xxx)
  const patterns = [
    /doi\s*[:：]\s*(10\.[0-9]+\/[^\s\)\]"',]+)/i,
    /\(?(10\.[0-9]{4,}\/[^\s\)\]"',]+)\)?/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean up the DOI
      let doi = match[1].trim();
      // Remove trailing punctuation
      doi = doi.replace(/[.,;:\]）)]+$/, '');
      return doi;
    }
  }
  return null;
}

async function fetchCrossRef(doi: string): Promise<any | null> {
  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LabWebsite/1.0 (mailto:takahashi@i.u-tokyo.ac.jp)' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.message;
  } catch {
    return null;
  }
}

async function main() {
  // Load first batch
  const batch = JSON.parse(fs.readFileSync(path.join(BATCHES_DIR, 'batch-000.json'), 'utf-8'));

  console.log(`Testing batch: ${batch.category} (${batch.items.length} items)\n`);

  let withDoi = 0;
  let crossrefSuccess = 0;

  // Test first 10 items (items are raw strings, not objects)
  const testItems = batch.items.slice(0, 10);

  for (const item of testItems) {
    const raw = typeof item === 'string' ? item : item.raw;
    const doi = extractDoi(raw);
    console.log(`---`);
    console.log(`Raw: ${raw.slice(0, 100)}...`);
    console.log(`DOI found: ${doi || 'NO'}`);

    if (doi) {
      withDoi++;
      const cr = await fetchCrossRef(doi);
      if (cr) {
        crossrefSuccess++;
        console.log(`CrossRef: ✓`);
        console.log(`  Title: ${Array.isArray(cr.title) ? cr.title[0] : cr.title}`);
        console.log(`  Authors: ${cr.author?.map((a: any) => a.family).join(', ')}`);
        console.log(`  Year: ${cr['published-print']?.['date-parts']?.[0]?.[0] || cr['published-online']?.['date-parts']?.[0]?.[0]}`);
      } else {
        console.log(`CrossRef: ✗ (not found)`);
      }
    }
    console.log('');
  }

  console.log(`\n=== Summary ===`);
  console.log(`Tested: ${testItems.length}`);
  console.log(`With DOI: ${withDoi}`);
  console.log(`CrossRef success: ${crossrefSuccess}`);
}

main().catch(console.error);
