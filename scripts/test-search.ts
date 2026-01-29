import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'qwen3-embedding:8b';
const TARGET_DIM = 1024;

interface Paper { id: string; title: string; tags?: string[] }

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt: text }),
  });
  const data = await response.json();
  return data.embedding.slice(0, TARGET_DIM);
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function loadPapers(): Map<string, Paper> {
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const papers = new Map<string, Paper>();
  const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml'));
  for (const file of files) {
    try {
      const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8')) as Paper;
      if (data?.id) papers.set(data.id, data);
    } catch {}
  }
  return papers;
}

async function search(query: string, embMap: Map<string, number[]>, papers: Map<string, Paper>) {
  const qEmb = await getEmbedding(query);

  const results: { id: string; sim: number; title: string; tags: string[] }[] = [];
  for (const [id, emb] of embMap) {
    const sim = cosineSim(qEmb, emb);
    const paper = papers.get(id);
    results.push({
      id,
      sim,
      title: paper?.title?.slice(0, 50) || id,
      tags: (paper?.tags || []).filter(t => t.includes(':'))
    });
  }

  results.sort((a, b) => b.sim - a.sim);
  return results.slice(0, 5);
}

async function main() {
  console.log('Loading embeddings...');
  const embeddings = JSON.parse(fs.readFileSync('public/embeddings.json', 'utf-8'));
  const embMap = new Map<string, number[]>(embeddings.map((e: any) => [e.id, e.embedding]));
  console.log(`Loaded ${embMap.size} embeddings`);

  console.log('Loading papers...');
  const papers = loadPapers();
  console.log(`Loaded ${papers.size} papers\n`);

  const queries = [
    'mismatch negativity rat',
    'reservoir computing culture',
    'seizure detection EEG',
    'auditory cortex plasticity'
  ];

  for (const q of queries) {
    console.log(`\n=== "${q}" ===`);
    const res = await search(q, embMap, papers);
    for (const r of res) {
      const tags = r.tags.slice(0, 3).join(', ');
      console.log(`[${r.sim.toFixed(2)}] ${r.title}...`);
      console.log(`        ${tags}`);
    }
  }
}

main().catch(console.error);
