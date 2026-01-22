/**
 * Grant Parser - Specialized for 競争的資金
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

interface Grant {
  id: string;
  title: string;
  funder: string;
  program?: string;
  pi: string;
  coPis?: string[];
  amount?: string;
  period?: string;
  startYear?: number;
  endYear?: number;
  grantNumber?: string;
  _raw: string;
  _valid: boolean;
  _errors?: string[];
}

const GRANT_PROMPT = `Parse this Japanese research grant entry into JSON. Extract:
- title: Project title
- funder: Funding organization (e.g., 科研費, JST, NEDO)
- program: Grant program name (e.g., 基盤研究(B), さきがけ)
- pi: Principal investigator name
- coPis: Array of co-investigators if any
- amount: Funding amount if mentioned
- period: Grant period (e.g., "2020-2023")
- startYear: Start year as number
- endYear: End year as number
- grantNumber: Grant number if present

Return ONLY valid JSON:
{"title":"...","funder":"...","program":"...","pi":"...","period":"...","startYear":2020,"endYear":2023}

Grant entry:
`;

async function parseWithOllama(raw: string): Promise<Partial<Grant>> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: GRANT_PROMPT + raw + '\n\nJSON:',
      stream: false,
      options: { temperature: 0.1, num_predict: 500 }
    })
  });

  const data = await response.json() as any;
  const text = data.response || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}

function validate(grant: Partial<Grant>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!grant.title) errors.push('Missing title');
  if (!grant.pi) errors.push('Missing PI');
  return { valid: errors.length === 0, errors };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Grant Parser');
  console.log('='.repeat(60));

  const grantBatches = ['batch-068.json', 'batch-069.json'];

  for (const batchFile of grantBatches) {
    const batchPath = path.join(BATCHES_DIR, batchFile);
    if (!fs.existsSync(batchPath)) continue;

    const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    console.log(`\n[${batchFile}] ${batch.items.length} grants`);

    const results: Grant[] = [];

    for (let i = 0; i < batch.items.length; i++) {
      const raw = batch.items[i];
      process.stdout.write(`  ${i + 1}/${batch.items.length} `);

      try {
        const parsed = await parseWithOllama(raw);
        const { valid, errors } = validate(parsed);

        results.push({
          id: `grant-${batch.batchId}-${i + 1}`,
          title: parsed.title || '',
          funder: parsed.funder || '',
          program: parsed.program,
          pi: parsed.pi || '',
          coPis: parsed.coPis,
          amount: parsed.amount,
          period: parsed.period,
          startYear: parsed.startYear,
          endYear: parsed.endYear,
          grantNumber: parsed.grantNumber,
          _raw: raw,
          _valid: valid,
          _errors: errors.length > 0 ? errors : undefined
        });

        process.stdout.write(valid ? '✓ ' : '⚠ ');
      } catch (err) {
        console.log('✗');
        results.push({
          id: `grant-${batch.batchId}-${i + 1}`,
          title: '',
          funder: '',
          pi: '',
          _raw: raw,
          _valid: false,
          _errors: [(err as Error).message]
        });
      }
    }

    const outPath = path.join(OUTPUT_DIR, batchFile.replace('.json', '-parsed.json'));
    fs.writeFileSync(outPath, JSON.stringify({
      batchId: batch.batchId,
      category: 'grant',
      parsedAt: new Date().toISOString(),
      items: results,
      stats: { total: results.length, valid: results.filter(r => r._valid).length }
    }, null, 2));

    console.log(`\n  Saved: ${outPath}`);
    console.log(`  Valid: ${results.filter(r => r._valid).length}/${results.length}`);
  }
}

main().catch(console.error);
