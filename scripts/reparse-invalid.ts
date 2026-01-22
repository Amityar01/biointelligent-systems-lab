/**
 * Re-parse invalid publications with improved prompts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSED_DIR = path.join(__dirname, '..', 'scraped', 'parsed');
const MODEL = 'glm4:9b'; // Faster model for re-parsing

async function parseWithOllama(raw: string): Promise<any> {
  const prompt = `Parse this academic citation and return ONLY valid JSON (no explanation):

Citation: ${raw}

Extract these fields:
- authors: array of author names (e.g., ["Hirokazu Takahashi", "Tomoyo Shiramatsu"])
- title: paper title only (without authors, journal, year)
- journal: journal or conference name
- year: publication year as number
- volume: volume number if present
- pages: page numbers if present
- doi: DOI if present

Return JSON like: {"authors":["Name1","Name2"],"title":"Paper Title","journal":"Journal Name","year":2020}`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false
      })
    });

    const data = await response.json() as { response: string };
    let text = data.response.trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Re-parsing Invalid Publications');
  console.log('='.repeat(60));

  const files = fs.readdirSync(PARSED_DIR)
    .filter(f => f.startsWith('batch-') && f.endsWith('-parsed.json'))
    .sort();

  let totalInvalid = 0;
  let fixed = 0;
  let stillInvalid = 0;

  for (const file of files) {
    const filePath = path.join(PARSED_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const invalidItems = data.items
      .map((item: any, idx: number) => ({ item, idx }))
      .filter(({ item }: any) => item._valid === false);

    if (invalidItems.length === 0) continue;

    console.log(`\n[${file}] ${invalidItems.length} invalid items`);
    totalInvalid += invalidItems.length;

    for (const { item, idx } of invalidItems) {
      process.stdout.write(`  ${idx + 1}`);

      const parsed = await parseWithOllama(item._raw);

      if (parsed && parsed.authors && parsed.authors.length > 0 && parsed.title) {
        // Update the item
        data.items[idx] = {
          ...item,
          authors: parsed.authors,
          title: parsed.title,
          journal: parsed.journal || item.journal,
          year: parsed.year || item.year,
          volume: parsed.volume || item.volume,
          pages: parsed.pages || item.pages,
          doi: parsed.doi || item.doi,
          _valid: true,
          _source: 'ollama-reparse',
          _errors: []
        };
        process.stdout.write(' ✓');
        fixed++;
      } else {
        process.stdout.write(' ✗');
        stillInvalid++;
      }
    }

    // Save updated file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`\n  Saved: ${file}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total invalid: ${totalInvalid}`);
  console.log(`Fixed: ${fixed}`);
  console.log(`Still invalid: ${stillInvalid}`);
}

main().catch(console.error);
