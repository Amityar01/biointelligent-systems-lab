/**
 * Thesis Parser - Specialized for 研究・論文指導 (卒論/修論/博論)
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

interface Thesis {
  id: string;
  student: string;
  title: string;
  degreeType: 'bachelor' | 'master' | 'phd';
  university: string;
  department?: string;
  year?: number;
  month?: number;
  supervisor?: string;
  _raw: string;
  _valid: boolean;
  _errors?: string[];
}

const THESIS_PROMPT = `Parse this Japanese thesis entry into JSON. Extract:
- student: Student name
- title: Thesis title
- degreeType: "bachelor" for 卒業論文, "master" for 修士論文, "phd" for 博士論文
- university: University name (usually 東京大学)
- department: Department or faculty
- year: Year as number
- month: Month as number (usually 2 for February, 3 for March)
- supervisor: Supervisor name if mentioned (指導教官/指導教員)

Return ONLY valid JSON:
{"student":"...","title":"...","degreeType":"bachelor","university":"東京大学","year":2020,"month":2,"supervisor":"..."}

Thesis entry:
`;

async function parseWithOllama(raw: string): Promise<Partial<Thesis>> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: THESIS_PROMPT + raw + '\n\nJSON:',
      stream: false,
      options: { temperature: 0.1, num_predict: 400 }
    })
  });

  const data = await response.json() as any;
  const text = data.response || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}

function validate(thesis: Partial<Thesis>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!thesis.student) errors.push('Missing student name');
  if (!thesis.title) errors.push('Missing title');
  if (!thesis.degreeType) errors.push('Missing degree type');
  return { valid: errors.length === 0, errors };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Thesis Parser');
  console.log('='.repeat(60));

  const thesisBatches = [
    'batch-074.json', 'batch-075.json', 'batch-076.json', 'batch-077.json',
    'batch-078.json', 'batch-079.json', 'batch-080.json'
  ];

  for (const batchFile of thesisBatches) {
    const batchPath = path.join(BATCHES_DIR, batchFile);
    if (!fs.existsSync(batchPath)) continue;

    const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    console.log(`\n[${batchFile}] ${batch.items.length} theses`);

    const results: Thesis[] = [];

    for (let i = 0; i < batch.items.length; i++) {
      const raw = batch.items[i];
      process.stdout.write(`  ${i + 1}/${batch.items.length} `);

      try {
        const parsed = await parseWithOllama(raw);
        const { valid, errors } = validate(parsed);

        results.push({
          id: `thesis-${batch.batchId}-${i + 1}`,
          student: parsed.student || '',
          title: parsed.title || '',
          degreeType: parsed.degreeType || 'bachelor',
          university: parsed.university || '東京大学',
          department: parsed.department,
          year: parsed.year,
          month: parsed.month,
          supervisor: parsed.supervisor,
          _raw: raw,
          _valid: valid,
          _errors: errors.length > 0 ? errors : undefined
        });

        process.stdout.write(valid ? '✓ ' : '⚠ ');
      } catch (err) {
        console.log('✗');
        results.push({
          id: `thesis-${batch.batchId}-${i + 1}`,
          student: '',
          title: '',
          degreeType: 'bachelor',
          university: '東京大学',
          _raw: raw,
          _valid: false,
          _errors: [(err as Error).message]
        });
      }
    }

    const outPath = path.join(OUTPUT_DIR, batchFile.replace('.json', '-parsed.json'));
    fs.writeFileSync(outPath, JSON.stringify({
      batchId: batch.batchId,
      category: 'thesis',
      parsedAt: new Date().toISOString(),
      items: results,
      stats: { total: results.length, valid: results.filter(r => r._valid).length }
    }, null, 2));

    console.log(`\n  Saved: ${outPath}`);
    console.log(`  Valid: ${results.filter(r => r._valid).length}/${results.length}`);
  }
}

main().catch(console.error);
