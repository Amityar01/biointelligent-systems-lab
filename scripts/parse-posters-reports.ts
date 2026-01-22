/**
 * Poster & Report Parser - Similar schema to publications
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

interface Presentation {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  conference?: string;
  location?: string;
  date?: string;
  pages?: string;
  type: 'poster' | 'report';
  language: 'ja' | 'en';
  _raw: string;
  _valid: boolean;
  _errors?: string[];
}

const POSTER_PROMPT = `Parse this Japanese poster/report entry into JSON. Extract:
- title: Title of the presentation/report
- authors: Array of author names
- year: Year as number
- conference: Conference or venue name
- location: Location (city, country)
- date: Date of presentation
- pages: Page numbers if any
- language: "ja" for Japanese, "en" for English

Return ONLY valid JSON:
{"title":"...","authors":["..."],"year":2020,"conference":"...","location":"...","date":"..."}

Entry:
`;

async function parseWithOllama(raw: string): Promise<Partial<Presentation>> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: POSTER_PROMPT + raw + '\n\nJSON:',
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

function validate(pres: Partial<Presentation>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!pres.title) errors.push('Missing title');
  if (!pres.authors?.length) errors.push('Missing authors');
  return { valid: errors.length === 0, errors };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Poster & Report Parser');
  console.log('='.repeat(60));

  // Poster batches: 055-063, Report batch: 064
  const batchConfigs = [
    { file: 'batch-055.json', type: 'poster' as const },
    { file: 'batch-056.json', type: 'poster' as const },
    { file: 'batch-057.json', type: 'poster' as const },
    { file: 'batch-058.json', type: 'poster' as const },
    { file: 'batch-059.json', type: 'poster' as const },
    { file: 'batch-060.json', type: 'poster' as const },
    { file: 'batch-061.json', type: 'poster' as const },
    { file: 'batch-062.json', type: 'poster' as const },
    { file: 'batch-063.json', type: 'poster' as const },
    { file: 'batch-064.json', type: 'report' as const },
  ];

  for (const config of batchConfigs) {
    const batchPath = path.join(BATCHES_DIR, config.file);
    if (!fs.existsSync(batchPath)) continue;

    const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    console.log(`\n[${config.file}] ${batch.items.length} ${config.type}s`);

    const results: Presentation[] = [];

    for (let i = 0; i < batch.items.length; i++) {
      const raw = batch.items[i];
      process.stdout.write(`  ${i + 1}/${batch.items.length} `);

      try {
        const parsed = await parseWithOllama(raw);
        const { valid, errors } = validate(parsed);

        results.push({
          id: `${config.type}-${batch.batchId}-${i + 1}`,
          title: parsed.title || '',
          authors: parsed.authors || [],
          year: parsed.year,
          conference: parsed.conference,
          location: parsed.location,
          date: parsed.date,
          pages: parsed.pages,
          type: config.type,
          language: parsed.language || 'ja',
          _raw: raw,
          _valid: valid,
          _errors: errors.length > 0 ? errors : undefined
        });

        process.stdout.write(valid ? '✓ ' : '⚠ ');
      } catch (err) {
        console.log('✗');
        results.push({
          id: `${config.type}-${batch.batchId}-${i + 1}`,
          title: '',
          authors: [],
          type: config.type,
          language: 'ja',
          _raw: raw,
          _valid: false,
          _errors: [(err as Error).message]
        });
      }
    }

    const outPath = path.join(OUTPUT_DIR, config.file.replace('.json', '-parsed.json'));
    fs.writeFileSync(outPath, JSON.stringify({
      batchId: batch.batchId,
      category: config.type,
      parsedAt: new Date().toISOString(),
      items: results,
      stats: { total: results.length, valid: results.filter(r => r._valid).length }
    }, null, 2));

    console.log(`\n  Saved: ${outPath}`);
    console.log(`  Valid: ${results.filter(r => r._valid).length}/${results.length}`);
  }
}

main().catch(console.error);
