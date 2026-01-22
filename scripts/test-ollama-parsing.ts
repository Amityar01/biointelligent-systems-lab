/**
 * Test Ollama models for publication parsing
 * Run: npx ts-node scripts/test-ollama-parsing.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLLAMA_URL = 'http://localhost:11434/api/generate';

// Test samples - mix of Japanese and English, simple and complex
const TEST_SAMPLES = [
  // Japanese with DOI and award
  `(16) 船水章大，神崎亮平，高橋宏知：「識別精度に基づいた時空間的神経活動パターンの逐次的次元縮約法」，電気学会論文誌C電子情報システム部門誌 129 (9): pp. 1648-1654, 2009 (doi: 10.1541/ieejeiss.129.1648) [平成21年電気学会電子・情報システム部門誌奨励賞]`,

  // English journal article
  `(45) Amit Yaron, Dai Akita, Tomoyo I. Shiramatsu, Hirokazu Takahashi: "Deviance Detection in Rat Auditory Cortex Is Robust to Parametric Manipulations Resembling Natural Conditions." eNeuro 12(6): ENEURO.0138-25.2025, 2025 (doi: 10.1523/ENEURO.0138-25.2025)`,

  // Conference paper with location
  `(7) Jun Suzurikawa, Kohei Hisada, Masayuki Nakao, Kimitaka Kaga, Ryohei Kanzaki, and Hirokazu Takahashi: "Reorganization of Auditory Cortex by Pairing and Anti-Pairing Intracortical Microstimulation." Proceedings of 2nd International IEEE EMBS Conference on Neural Engineering: pp. 594-597, 2005 (Washington DC, USA, 2005年3月16日) [Excellence in Neural Engineering Award受賞]`,
];

const PARSE_PROMPT = `Parse this academic publication citation into JSON. Extract ALL fields present.

Citation:
{citation}

Return ONLY valid JSON with these fields (omit if not present):
{
  "authors": ["array of author names"],
  "title": "publication title",
  "journal": "journal or venue name",
  "volume": "volume number",
  "issue": "issue number",
  "pages": "page range",
  "year": 2024,
  "doi": "DOI without url prefix",
  "url": "URL if present",
  "conference": "conference name if applicable",
  "location": "location/venue",
  "date": "specific date if given",
  "awards": ["any awards mentioned"],
  "type": "journal|conference|book|presentation"
}

JSON output:`;

async function callOllama(model: string, prompt: string): Promise<{ response: string; duration: number }> {
  const start = Date.now();

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,  // Low temp for consistent extraction
        num_predict: 1000
      }
    })
  });

  const data = await response.json();
  const duration = Date.now() - start;

  return { response: data.response, duration };
}

function extractJson(text: string): any {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      return { error: 'Failed to parse JSON', raw: text };
    }
  }
  return { error: 'No JSON found', raw: text };
}

async function testModel(model: string, samples: string[]) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${model}`);
  console.log('='.repeat(60));

  const results: any[] = [];
  let totalTime = 0;

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    console.log(`\nSample ${i + 1}/${samples.length}...`);
    console.log(`Input: ${sample.substring(0, 80)}...`);

    const prompt = PARSE_PROMPT.replace('{citation}', sample);

    try {
      const { response, duration } = await callOllama(model, prompt);
      totalTime += duration;

      const parsed = extractJson(response);
      results.push({
        input: sample,
        output: parsed,
        duration
      });

      console.log(`Time: ${duration}ms`);
      console.log(`Output: ${JSON.stringify(parsed, null, 2).substring(0, 300)}...`);
    } catch (error) {
      console.log(`Error: ${error}`);
      results.push({ input: sample, error: String(error) });
    }
  }

  console.log(`\nTotal time for ${samples.length} samples: ${totalTime}ms`);
  console.log(`Average per sample: ${Math.round(totalTime / samples.length)}ms`);

  return { model, results, totalTime, avgTime: totalTime / samples.length };
}

async function main() {
  console.log('Testing Ollama models for publication parsing\n');
  console.log(`Test samples: ${TEST_SAMPLES.length}`);

  const models = ['qwen3:14b', 'qwen3:32b'];
  const allResults: any[] = [];

  for (const model of models) {
    const result = await testModel(model, TEST_SAMPLES);
    allResults.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  for (const r of allResults) {
    console.log(`\n${r.model}:`);
    console.log(`  Total time: ${r.totalTime}ms`);
    console.log(`  Avg per item: ${Math.round(r.avgTime)}ms`);
    console.log(`  Estimated for 1306 items: ${Math.round(r.avgTime * 1306 / 1000 / 60)} minutes`);
  }

  // Save results
  const outputPath = path.join(__dirname, '..', 'scraped', 'ollama-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\nDetailed results saved to: ${outputPath}`);
}

main().catch(console.error);
