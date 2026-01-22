/**
 * Test the improved parser on sample citations
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCHES_DIR = path.join(__dirname, '..', 'scraped', 'batches');

const PROMPT = `Parse this academic citation. Extract the fields and return ONLY valid JSON.

EXAMPLE INPUT:
"(1) Hirokazu Takahashi, Tomoyo Shiramatsu: "Neural mechanisms of auditory perception." Journal of Neuroscience 45(3): pp. 123-145, 2020"

EXAMPLE OUTPUT:
{"authors":["Hirokazu Takahashi","Tomoyo Shiramatsu"],"title":"Neural mechanisms of auditory perception","journal":"Journal of Neuroscience","volume":"45","issue":"3","pages":"123-145","year":2020,"type":"journal"}

NOW PARSE THIS:
{citation}

RULES:
- authors: Extract ALL author names as an array (Japanese names like 高橋宏知 are fine)
- title: The paper title ONLY (usually in quotes or after colon)
- year: 4-digit number
- type: one of journal/conference/book/review/presentation

Return ONLY the JSON object, nothing else:`;

async function testParse(raw: string): Promise<{ valid: boolean; authors: string[]; title: string; year: number | null }> {
  const resp = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'glm4:9b',
      prompt: PROMPT.replace('{citation}', raw),
      stream: false,
      options: { temperature: 0.1 }
    })
  });

  const data = await resp.json() as { response: string };
  const text = data.response;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return { valid: false, authors: [], title: '', year: null };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      valid: parsed.authors?.length > 0 && !!parsed.title,
      authors: parsed.authors || [],
      title: parsed.title || '',
      year: parsed.year || null
    };
  } catch {
    return { valid: false, authors: [], title: '', year: null };
  }
}

async function main() {
  console.log('Testing improved parser on sample citations\n');

  // Test batches: English conference, Japanese review, Japanese book
  const testBatches = ['batch-006.json', 'batch-008.json', 'batch-011.json'];

  let total = 0;
  let valid = 0;

  for (const batchFile of testBatches) {
    const batchPath = path.join(BATCHES_DIR, batchFile);
    if (!fs.existsSync(batchPath)) continue;

    const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    console.log(`\n[${batchFile}] ${batch.category} - testing 5 items`);

    for (let i = 0; i < Math.min(5, batch.items.length); i++) {
      const raw = batch.items[i];
      total++;

      process.stdout.write(`  ${i + 1}. `);
      const result = await testParse(raw);

      if (result.valid) {
        valid++;
        console.log(`✓ ${result.authors.length} authors, year=${result.year}`);
      } else {
        console.log(`✗ FAILED`);
        console.log(`     Raw: ${raw.substring(0, 60)}...`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${valid}/${total} valid (${(100 * valid / total).toFixed(0)}%)`);
}

main().catch(console.error);
