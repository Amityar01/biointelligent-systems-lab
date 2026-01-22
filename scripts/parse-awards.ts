/**
 * Award Parser - Specialized for 受賞
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

interface Award {
  id: string;
  awardName: string;
  awardNameEn?: string;
  recipients: string[];
  organization?: string;
  paperTitle?: string;
  conference?: string;
  date?: string;
  year?: number;
  _raw: string;
  _valid: boolean;
  _errors?: string[];
}

const AWARD_PROMPT = `Parse this Japanese award entry into JSON. Extract:
- awardName: Name of the award (Japanese)
- awardNameEn: English name if present
- recipients: Array of recipient names
- organization: Awarding organization
- paperTitle: Title of the awarded paper/presentation if any
- conference: Conference or journal name
- date: Award date
- year: Year as number

Return ONLY valid JSON, no markdown:
{"awardName":"...","recipients":["..."],"organization":"...","paperTitle":"...","date":"...","year":2020}

Award entry:
`;

async function parseWithOllama(raw: string): Promise<Partial<Award>> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: AWARD_PROMPT + raw + '\n\nJSON:',
      stream: false,
      options: { temperature: 0.1, num_predict: 600 }
    })
  });

  const data = await response.json() as any;
  const text = data.response || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}

function validate(award: Partial<Award>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!award.awardName) errors.push('Missing award name');
  if (!award.recipients?.length) errors.push('Missing recipients');
  return { valid: errors.length === 0, errors };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Award Parser');
  console.log('='.repeat(60));

  const awardBatches = ['batch-066.json', 'batch-067.json'];

  for (const batchFile of awardBatches) {
    const batchPath = path.join(BATCHES_DIR, batchFile);
    if (!fs.existsSync(batchPath)) continue;

    const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    console.log(`\n[${batchFile}] ${batch.items.length} awards`);

    const results: Award[] = [];

    for (let i = 0; i < batch.items.length; i++) {
      const raw = batch.items[i];
      process.stdout.write(`  ${i + 1}/${batch.items.length} `);

      try {
        const parsed = await parseWithOllama(raw);
        const { valid, errors } = validate(parsed);

        results.push({
          id: `award-${batch.batchId}-${i + 1}`,
          awardName: parsed.awardName || '',
          awardNameEn: parsed.awardNameEn,
          recipients: parsed.recipients || [],
          organization: parsed.organization,
          paperTitle: parsed.paperTitle,
          conference: parsed.conference,
          date: parsed.date,
          year: parsed.year,
          _raw: raw,
          _valid: valid,
          _errors: errors.length > 0 ? errors : undefined
        });

        process.stdout.write(valid ? '✓ ' : '⚠ ');
      } catch (err) {
        console.log('✗');
        results.push({
          id: `award-${batch.batchId}-${i + 1}`,
          awardName: '',
          recipients: [],
          _raw: raw,
          _valid: false,
          _errors: [(err as Error).message]
        });
      }
    }

    const outPath = path.join(OUTPUT_DIR, batchFile.replace('.json', '-parsed.json'));
    fs.writeFileSync(outPath, JSON.stringify({
      batchId: batch.batchId,
      category: 'award',
      parsedAt: new Date().toISOString(),
      items: results,
      stats: { total: results.length, valid: results.filter(r => r._valid).length }
    }, null, 2));

    console.log(`\n  Saved: ${outPath}`);
    console.log(`  Valid: ${results.filter(r => r._valid).length}/${results.length}`);
  }
}

main().catch(console.error);
