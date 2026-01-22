/**
 * Parse all publications using Ollama qwen3:32b
 * Run: npx ts-node scripts/parse-with-ollama.ts
 *
 * Progress is saved after each batch, so it can resume if interrupted.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'qwen3:32b';
const BATCHES_DIR = path.join(__dirname, '..', 'scraped', 'batches');
const PARSED_DIR = path.join(__dirname, '..', 'scraped', 'parsed');
const PROGRESS_FILE = path.join(PARSED_DIR, 'progress.json');

// Ensure output directory exists
if (!fs.existsSync(PARSED_DIR)) {
  fs.mkdirSync(PARSED_DIR, { recursive: true });
}

const PARSE_PROMPT = `Parse this academic publication citation into JSON. Extract ALL fields that are present.

Citation:
{citation}

Return ONLY valid JSON (no explanation, no markdown) with these fields (omit fields that are not present):
{
  "authors": ["array of author names exactly as written"],
  "title": "publication title",
  "journal": "journal name",
  "volume": "volume number",
  "issue": "issue number",
  "pages": "page range",
  "year": 2024,
  "doi": "DOI string without URL prefix",
  "url": "URL if present",
  "conference": "conference name if this is a conference paper",
  "location": "conference location if present",
  "date": "specific date if given",
  "publisher": "publisher name for books",
  "awards": ["any awards mentioned in brackets"],
  "type": "journal|conference|book|presentation|review"
}

JSON:`;

async function callOllama(prompt: string): Promise<string> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 1000
      }
    })
  });

  const data = await response.json();
  return data.response || '';
}

function extractJson(text: string): any {
  // Remove thinking tags if present (qwen3 sometimes outputs these)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Try to find JSON in the response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      return { parseError: 'Invalid JSON', raw: text };
    }
  }
  return { parseError: 'No JSON found', raw: text };
}

function loadProgress(): { completedBatches: string[], stats: any } {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { completedBatches: [], stats: { totalItems: 0, totalTime: 0, startedAt: new Date().toISOString() } };
}

function saveProgress(progress: { completedBatches: string[], stats: any }) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function parseBatch(batchFile: string): Promise<{ items: any[], time: number }> {
  const batchPath = path.join(BATCHES_DIR, batchFile);
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

  const parsedItems: any[] = [];
  const startTime = Date.now();

  for (let i = 0; i < batch.items.length; i++) {
    const raw = batch.items[i];
    const prompt = PARSE_PROMPT.replace('{citation}', raw);

    try {
      const response = await callOllama(prompt);
      const parsed = extractJson(response);
      parsed.raw = raw;
      parsed._batchIndex = batch.startIndex + i;
      parsedItems.push(parsed);
    } catch (error) {
      parsedItems.push({
        parseError: String(error),
        raw,
        _batchIndex: batch.startIndex + i
      });
    }

    // Progress indicator
    process.stdout.write(`\r  Item ${i + 1}/${batch.items.length}`);
  }

  const elapsed = Date.now() - startTime;
  console.log(` - ${elapsed}ms total, ${Math.round(elapsed / batch.items.length)}ms/item`);

  // Save parsed batch
  const outputFile = batchFile.replace('.json', '-parsed.json');
  const outputPath = path.join(PARSED_DIR, outputFile);
  fs.writeFileSync(outputPath, JSON.stringify({
    batchId: batch.batchId,
    category: batch.category,
    categoryTitle: batch.categoryTitle,
    parsedAt: new Date().toISOString(),
    model: MODEL,
    items: parsedItems
  }, null, 2));

  return { items: parsedItems, time: elapsed };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Publication Parser - Ollama qwen3:32b');
  console.log('='.repeat(60));
  console.log(`\nModel: ${MODEL}`);
  console.log(`Batches dir: ${BATCHES_DIR}`);
  console.log(`Output dir: ${PARSED_DIR}\n`);

  // Load manifest
  const manifest = JSON.parse(fs.readFileSync(path.join(BATCHES_DIR, 'manifest.json'), 'utf-8'));
  console.log(`Total batches: ${manifest.totalBatches}`);
  console.log(`Total items: ${manifest.totalItems}\n`);

  // Load progress
  const progress = loadProgress();
  const remainingBatches = manifest.batches.filter((b: any) => !progress.completedBatches.includes(b.file));

  if (progress.completedBatches.length > 0) {
    console.log(`Resuming: ${progress.completedBatches.length} batches already done`);
  }
  console.log(`Remaining: ${remainingBatches.length} batches\n`);

  if (remainingBatches.length === 0) {
    console.log('All batches already processed!');
    return;
  }

  // Warm up the model
  console.log('Warming up model...');
  await callOllama('Hello');
  console.log('Model ready.\n');

  const overallStart = Date.now();

  for (let i = 0; i < remainingBatches.length; i++) {
    const batch = remainingBatches[i];
    const batchNum = progress.completedBatches.length + i + 1;

    console.log(`[${batchNum}/${manifest.totalBatches}] ${batch.file} (${batch.category}, ${batch.count} items)`);

    const { items, time } = await parseBatch(batch.file);

    // Update progress
    progress.completedBatches.push(batch.file);
    progress.stats.totalItems += items.length;
    progress.stats.totalTime += time;
    progress.stats.lastBatch = batch.file;
    progress.stats.lastUpdate = new Date().toISOString();
    saveProgress(progress);

    // ETA calculation
    const avgTimePerBatch = progress.stats.totalTime / progress.completedBatches.length;
    const remainingCount = manifest.totalBatches - progress.completedBatches.length;
    const etaMs = avgTimePerBatch * remainingCount;
    const etaMins = Math.round(etaMs / 1000 / 60);

    console.log(`  Saved. ETA: ${etaMins} minutes remaining\n`);
  }

  const totalTime = Date.now() - overallStart;
  console.log('='.repeat(60));
  console.log('COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total time: ${Math.round(totalTime / 1000 / 60)} minutes`);
  console.log(`Items processed: ${progress.stats.totalItems}`);
  console.log(`Output: ${PARSED_DIR}`);
}

main().catch(console.error);
