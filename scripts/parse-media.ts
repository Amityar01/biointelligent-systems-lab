/**
 * Media Parser - Specialized for メディア発表
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

interface MediaAppearance {
  id: string;
  title: string;
  outlet: string;
  outletType: 'tv' | 'radio' | 'newspaper' | 'magazine' | 'web' | 'other';
  date?: string;
  year?: number;
  url?: string;
  description?: string;
  people?: string[];
  language: 'ja' | 'en';
  _raw: string;
  _valid: boolean;
  _errors?: string[];
}

const MEDIA_PROMPT = `Parse this Japanese media appearance entry into JSON. Extract:
- title: Title or topic of the appearance
- outlet: Media outlet name (TV station, newspaper, magazine, etc.)
- outletType: One of "tv", "radio", "newspaper", "magazine", "web", "other"
- date: Date of appearance
- year: Year as number
- url: URL if present
- description: Brief description if any
- people: Array of people involved
- language: "ja" for Japanese, "en" for English

Return ONLY valid JSON:
{"title":"...","outlet":"...","outletType":"tv","date":"...","year":2020,"people":["..."]}

Media entry:
`;

async function parseWithOllama(raw: string): Promise<Partial<MediaAppearance>> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: MEDIA_PROMPT + raw + '\n\nJSON:',
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

function validate(media: Partial<MediaAppearance>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!media.title) errors.push('Missing title');
  if (!media.outlet) errors.push('Missing outlet');
  return { valid: errors.length === 0, errors };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Media Parser');
  console.log('='.repeat(60));

  const mediaBatches = ['batch-070.json', 'batch-071.json', 'batch-072.json', 'batch-073.json'];

  for (const batchFile of mediaBatches) {
    const batchPath = path.join(BATCHES_DIR, batchFile);
    if (!fs.existsSync(batchPath)) continue;

    const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    console.log(`\n[${batchFile}] ${batch.items.length} media items`);

    const results: MediaAppearance[] = [];

    for (let i = 0; i < batch.items.length; i++) {
      const raw = batch.items[i];
      process.stdout.write(`  ${i + 1}/${batch.items.length} `);

      try {
        const parsed = await parseWithOllama(raw);
        const { valid, errors } = validate(parsed);

        results.push({
          id: `media-${batch.batchId}-${i + 1}`,
          title: parsed.title || '',
          outlet: parsed.outlet || '',
          outletType: parsed.outletType || 'other',
          date: parsed.date,
          year: parsed.year,
          url: parsed.url,
          description: parsed.description,
          people: parsed.people,
          language: parsed.language || 'ja',
          _raw: raw,
          _valid: valid,
          _errors: errors.length > 0 ? errors : undefined
        });

        process.stdout.write(valid ? '✓ ' : '⚠ ');
      } catch (err) {
        console.log('✗');
        results.push({
          id: `media-${batch.batchId}-${i + 1}`,
          title: '',
          outlet: '',
          outletType: 'other',
          language: 'ja',
          _raw: raw,
          _valid: false,
          _errors: [(err as Error).message]
        });
      }
    }

    const outPath = path.join(OUTPUT_DIR, batchFile.replace('.json', '-parsed.json'));
    fs.writeFileSync(outPath, JSON.stringify({
      batchId: batch.batchId,
      category: 'media',
      parsedAt: new Date().toISOString(),
      items: results,
      stats: { total: results.length, valid: results.filter(r => r._valid).length }
    }, null, 2));

    console.log(`\n  Saved: ${outPath}`);
    console.log(`  Valid: ${results.filter(r => r._valid).length}/${results.length}`);
  }
}

main().catch(console.error);
