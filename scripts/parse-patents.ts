/**
 * Patent Parser - Specialized for 創造的活動/特許
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCHES_DIR = path.join(__dirname, '..', 'scraped', 'batches');
const OUTPUT_DIR = path.join(__dirname, '..', 'scraped', 'parsed');
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'qwen3:32b';

interface Patent {
  id: string;
  title: string;
  inventors: string[];
  patentNumber?: string;
  applicationNumber?: string;
  applicationDate?: string;
  publicationNumber?: string;
  grantNumber?: string;
  grantDate?: string;
  _raw: string;
  _valid: boolean;
  _errors?: string[];
}

const PATENT_PROMPT = `Parse this Japanese patent entry into JSON. Extract:
- title: Patent title (Japanese)
- inventors: Array of inventor names
- applicationNumber: 特願 number (e.g., "特願2018-051262")
- applicationDate: Filing date
- publicationNumber: 特開 number (e.g., "特開2019-162237")
- grantNumber: 特許 number if granted (e.g., "特許第7072771号")
- grantDate: Grant date if available

Return ONLY valid JSON, no markdown, no explanation:
{"title":"...","inventors":["..."],"applicationNumber":"...","applicationDate":"...","publicationNumber":"...","grantNumber":"..."}

Patent entry:
`;

async function parseWithOllama(raw: string): Promise<Partial<Patent>> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: PATENT_PROMPT + raw + '\n\nJSON:',
      stream: false,
      options: { temperature: 0.1, num_predict: 500 }
    })
  });

  const data = await response.json() as any;
  const text = data.response || '';

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');

  return JSON.parse(jsonMatch[0]);
}

function validate(patent: Partial<Patent>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!patent.title) errors.push('Missing title');
  if (!patent.inventors?.length) errors.push('Missing inventors');
  return { valid: errors.length === 0, errors };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Patent Parser');
  console.log('='.repeat(60));

  const patentBatches = ['batch-065.json'];

  for (const batchFile of patentBatches) {
    const batchPath = path.join(BATCHES_DIR, batchFile);
    if (!fs.existsSync(batchPath)) {
      console.log(`Skipping ${batchFile} - not found`);
      continue;
    }

    const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    console.log(`\n[${batchFile}] ${batch.items.length} patents`);

    const results: Patent[] = [];

    for (let i = 0; i < batch.items.length; i++) {
      const raw = batch.items[i];
      process.stdout.write(`  ${i + 1}/${batch.items.length} `);

      try {
        const parsed = await parseWithOllama(raw);
        const { valid, errors } = validate(parsed);

        results.push({
          id: `patent-${i + 1}`,
          title: parsed.title || '',
          inventors: parsed.inventors || [],
          applicationNumber: parsed.applicationNumber,
          applicationDate: parsed.applicationDate,
          publicationNumber: parsed.publicationNumber,
          grantNumber: parsed.grantNumber,
          grantDate: parsed.grantDate,
          _raw: raw,
          _valid: valid,
          _errors: errors.length > 0 ? errors : undefined
        });

        process.stdout.write(valid ? '✓ ' : '⚠ ');
      } catch (err) {
        console.log('✗');
        results.push({
          id: `patent-${i + 1}`,
          title: '',
          inventors: [],
          _raw: raw,
          _valid: false,
          _errors: [(err as Error).message]
        });
      }
    }

    const outPath = path.join(OUTPUT_DIR, batchFile.replace('.json', '-parsed.json'));
    fs.writeFileSync(outPath, JSON.stringify({
      batchId: batch.batchId,
      category: 'patent',
      parsedAt: new Date().toISOString(),
      items: results,
      stats: {
        total: results.length,
        valid: results.filter(r => r._valid).length
      }
    }, null, 2));

    console.log(`\n  Saved: ${outPath}`);
    console.log(`  Valid: ${results.filter(r => r._valid).length}/${results.length}`);
  }
}

main().catch(console.error);
