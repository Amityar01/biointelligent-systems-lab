/**
 * Test auto-labeling on recent papers using "best match only" approach
 *
 * Usage: npx tsx scripts/test-labels.ts
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'qwen3-embedding:8b';
const TARGET_DIM = 1024;

const TOPICS = {
  model: {
    'rat-invivo': 'rat in vivo',
    'human': 'human EEG patient',
    'culture-invitro': 'neuronal culture in vitro',
    'insect': 'insect silkmoth',
    'computational': 'computational model simulation',
  },
  technique: {
    'probe-invivo': 'utah array neuropixels silicon probe',
    'mea-culture': 'CMOS MEA microelectrode array',
    'ecog': 'ECoG electrocorticography',
    'scalp-eeg': 'scalp EEG',
    'lfp': 'local field potential',
    'spike': 'spike sorting action potential',
    'imaging': 'calcium imaging two-photon',
    'optogenetics': 'optogenetics channelrhodopsin',
    'electrical-stim': 'vagus nerve stimulation electrical',
    'behavior': 'behavioral task operant',
  },
  domain: {
    'auditory': 'auditory cortex hearing',
    'mismatch-negativity': 'mismatch negativity MMN',
    'predictive-coding': 'deviance detection prediction error',
    'speech': 'speech larynx voice',
    'seizure': 'seizure epilepsy',
    'music': 'music rhythm beat',
    'plasticity': 'synaptic plasticity learning',
    'reservoir-computing': 'reservoir computing',
    'bmi': 'brain machine interface',
  },
};

interface Paper {
  id: string;
  title: string;
  year?: number;
  abstract?: string;
  type?: string;
}

interface EmbeddingEntry {
  id: string;
  embedding: number[];
}

function loadEmbeddings(): Map<string, number[]> {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'embeddings.json'), 'utf-8')) as EmbeddingEntry[];
  return new Map(data.map(e => [e.id, e.embedding]));
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt: text }),
  });
  const data = await response.json();
  return data.embedding.slice(0, TARGET_DIM);
}

function cosineSimilarity(a: number[], b: number[]): number {
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
  for (const file of fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml'))) {
    try {
      const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8'), { schema: yaml.JSON_SCHEMA }) as Paper;
      if (data?.id) papers.set(data.id, data);
    } catch {}
  }
  return papers;
}

async function main() {
  console.log('=== Test Labels (Best Match Only) ===\n');

  const paperEmbeddings = loadEmbeddings();
  const papers = loadPapers();

  // Get recent papers (2020+) that are journal/conference type
  const recentPapers = Array.from(papers.values())
    .filter(p => p.year && p.year >= 2020 && (p.type === 'journal' || p.type === 'conference'))
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .slice(0, 15);

  console.log(`Testing on ${recentPapers.length} recent papers (2020+)\n`);

  // Generate topic embeddings
  console.log('Generating topic embeddings...');
  const topicEmbeddings = new Map<string, Map<string, number[]>>();
  for (const [category, topics] of Object.entries(TOPICS)) {
    topicEmbeddings.set(category, new Map());
    for (const [name, description] of Object.entries(topics)) {
      topicEmbeddings.get(category)!.set(name, await getEmbedding(description));
    }
  }
  console.log('done\n');

  // Score each paper - BEST MATCH ONLY per category
  console.log('=== Results ===\n');

  for (const paper of recentPapers) {
    const emb = paperEmbeddings.get(paper.id);
    if (!emb) continue;

    console.log(`[${paper.year}] ${paper.title?.slice(0, 60)}...`);
    if (paper.abstract) console.log(`  (has abstract: ${paper.abstract.length} chars)`);

    const labels: string[] = [];

    for (const [category, topics] of topicEmbeddings) {
      // Score all topics in this category
      const scores: [string, number][] = [];
      for (const [name, topicEmb] of topics) {
        scores.push([name, cosineSimilarity(emb, topicEmb)]);
      }
      scores.sort((a, b) => b[1] - a[1]);

      // Take best match if score > 0.5, optionally second if close
      const [best, bestScore] = scores[0];
      const [second, secondScore] = scores[1];

      if (bestScore > 0.5) {
        labels.push(`${category}:${best} (${bestScore.toFixed(2)})`);
        // Include second if within 0.05 of best
        if (secondScore > 0.5 && bestScore - secondScore < 0.05) {
          labels.push(`${category}:${second} (${secondScore.toFixed(2)})`);
        }
      }
    }

    console.log(`  → ${labels.join(', ') || '(no strong matches)'}`);
    console.log('');
  }
}

main().catch(console.error);
