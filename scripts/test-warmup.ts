/**
 * Test Ollama warm-up latency
 */

const sample = '(1) 高橋宏知, 中尾政之: 「テスト論文」, 電気学会 10(1): pp.1-5, 2020';
const parsePrompt = `Parse this citation to JSON with authors, title, journal, volume, issue, pages, year:\n${sample}\n\nJSON:`;

async function test() {
  console.log("Testing qwen3:14b - 5 consecutive requests:\n");

  for (let i = 1; i <= 5; i++) {
    const start = Date.now();
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:14b',
        prompt: parsePrompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 300 }
      })
    });
    await res.json();
    const duration = Date.now() - start;
    console.log(`Request ${i}: ${duration}ms`);
  }
}

test();
