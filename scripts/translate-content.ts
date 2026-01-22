/**
 * Translate Japanese content to English using Ollama (qwen3:32b)
 * Adds bilingual support to all parsed content
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSED_DIR = path.join(__dirname, '..', 'scraped', 'parsed');
const OUTPUT_DIR = path.join(__dirname, '..', 'scraped', 'translated');
const MODEL = 'glm4:9b'; // Using glm4 to avoid competing with publication parser

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Check if text is primarily Japanese
function isJapanese(text: string): boolean {
  if (!text) return false;
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text);
}

// Strip thinking tags from qwen3 output
function stripThinking(text: string): string {
  if (text.includes('</think>')) {
    return text.split('</think>').pop()?.trim() || text;
  }
  return text.trim();
}

// Translate text using Ollama
async function translate(text: string): Promise<string> {
  if (!text || !isJapanese(text)) return text;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: `Translate this Japanese text to natural English. Output ONLY the translation, no explanations:\n\n${text}`,
        stream: false
      })
    });

    const data = await response.json() as { response: string };
    return stripThinking(data.response);
  } catch (err) {
    console.error(`Translation error: ${(err as Error).message}`);
    return text; // Return original on error
  }
}

// Process awards
async function translateAwards() {
  const inputPath = path.join(PARSED_DIR, 'awards-all.json');
  if (!fs.existsSync(inputPath)) return;

  console.log('\n[Awards] Translating...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    process.stdout.write(`  ${i + 1}/${data.items.length}`);

    if (isJapanese(item.awardName)) {
      item.awardName_en = await translate(item.awardName);
      item.awardName_ja = item.awardName;
      process.stdout.write(' ✓\n');
    } else {
      // Already English
      item.awardName_en = item.awardName;
      process.stdout.write(' (EN)\n');
    }
  }

  const outputPath = path.join(OUTPUT_DIR, 'awards-translated.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`  Saved: ${outputPath}`);
}

// Process grants
async function translateGrants() {
  const inputPath = path.join(PARSED_DIR, 'grants-all.json');
  if (!fs.existsSync(inputPath)) return;

  console.log('\n[Grants] Translating...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    process.stdout.write(`  ${i + 1}/${data.items.length}`);

    if (isJapanese(item.title)) {
      item.title_en = await translate(item.title);
      item.title_ja = item.title;
    }
    if (isJapanese(item.funder)) {
      item.funder_en = await translate(item.funder);
      item.funder_ja = item.funder;
    }
    process.stdout.write(' ✓\n');
  }

  const outputPath = path.join(OUTPUT_DIR, 'grants-translated.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`  Saved: ${outputPath}`);
}

// Process media
async function translateMedia() {
  const inputPath = path.join(PARSED_DIR, 'medias-all.json');
  if (!fs.existsSync(inputPath)) return;

  console.log('\n[Media] Translating...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    process.stdout.write(`  ${i + 1}/${data.items.length}`);

    if (isJapanese(item.title)) {
      item.title_en = await translate(item.title);
      item.title_ja = item.title;
    }
    if (isJapanese(item.source)) {
      item.source_en = await translate(item.source);
      item.source_ja = item.source;
    }
    process.stdout.write(' ✓\n');
  }

  const outputPath = path.join(OUTPUT_DIR, 'media-translated.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`  Saved: ${outputPath}`);
}

// Process theses
async function translateTheses() {
  const inputPath = path.join(PARSED_DIR, 'thesiss-all.json');
  if (!fs.existsSync(inputPath)) return;

  console.log('\n[Theses] Translating...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    process.stdout.write(`  ${i + 1}/${data.items.length}`);

    if (isJapanese(item.title)) {
      item.title_en = await translate(item.title);
      item.title_ja = item.title;
    }
    // Don't translate names, just romanize indicator
    process.stdout.write(' ✓\n');
  }

  const outputPath = path.join(OUTPUT_DIR, 'theses-translated.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`  Saved: ${outputPath}`);
}

// Process posters
async function translatePosters() {
  const inputPath = path.join(PARSED_DIR, 'posters-all.json');
  if (!fs.existsSync(inputPath)) return;

  console.log('\n[Posters] Translating...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    process.stdout.write(`  ${i + 1}/${data.items.length}`);

    if (isJapanese(item.title)) {
      item.title_en = await translate(item.title);
      item.title_ja = item.title;
    }
    process.stdout.write(' ✓\n');
  }

  const outputPath = path.join(OUTPUT_DIR, 'posters-translated.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`  Saved: ${outputPath}`);
}

// Save progress periodically
let progressFile = path.join(OUTPUT_DIR, 'translation-progress.json');

async function main() {
  console.log('='.repeat(60));
  console.log('Content Translation (qwen3:32b)');
  console.log('='.repeat(60));

  // Check if we should resume
  const args = process.argv.slice(2);
  const category = args[0]; // Optional: only translate specific category

  if (!category || category === 'awards') await translateAwards();
  if (!category || category === 'grants') await translateGrants();
  if (!category || category === 'media') await translateMedia();
  if (!category || category === 'theses') await translateTheses();
  if (!category || category === 'posters') await translatePosters();

  console.log('\n' + '='.repeat(60));
  console.log('Translation complete!');
}

main().catch(console.error);
