/**
 * Auto-label papers using embedding similarity (best-match approach)
 *
 * For each category, picks the highest-scoring label if above threshold.
 * Optionally includes 2nd place if within 0.05 of 1st.
 *
 * Categories:
 * - model: rat, human, culture, insect, computational
 * - technique: probe-invivo, mea-culture, ecog, scalp-eeg, lfp, spike, imaging, optogenetics, electrical-stim, behavior
 * - domain: auditory, mismatch-negativity, predictive-coding, speech, seizure, music, plasticity, reservoir-computing, bmi
 *
 * Usage: npx tsx scripts/auto-label.ts [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'qwen3-embedding:8b';
const TARGET_DIM = 1024;

// Topic definitions - short keywords for embedding similarity matching
const TOPICS = {
  model: {
    'rat': 'rat rodent auditory cortex',
    'human': 'human patient EEG',
    'culture': 'neuronal culture dissociated neurons',
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
  authors?: string[];
  year?: number;
  type?: string;
  abstract?: string;
  tags?: string[];
  [key: string]: unknown;
}

interface EmbeddingEntry {
  id: string;
  embedding: number[];
}

function loadEmbeddings(): Map<string, number[]> {
  const embPath = path.join(process.cwd(), 'public', 'embeddings.json');
  const data = JSON.parse(fs.readFileSync(embPath, 'utf-8')) as EmbeddingEntry[];
  const map = new Map<string, number[]>();
  for (const entry of data) {
    map.set(entry.id, entry.embedding);
  }
  return map;
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, prompt: text }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

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

function loadPapers(): Map<string, { path: string; data: Paper }> {
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const papers = new Map<string, { path: string; data: Paper }>();

  const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml'));
  for (const file of files) {
    const filePath = path.join(pubsDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as Paper;
      if (data?.id) {
        papers.set(data.id, { path: filePath, data });
      }
    } catch {}
  }
  return papers;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const minThreshold = 0.50; // Minimum score to consider
  const secondPlaceGap = 0.05; // Include 2nd place if within this gap of 1st

  console.log(`=== Auto-Label Papers (Best Match) ===\n`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Min threshold: ${minThreshold}, 2nd place gap: ${secondPlaceGap}\n`);

  // Check Ollama
  try {
    await fetch(`${OLLAMA_URL}/api/tags`);
  } catch {
    console.error('Error: Ollama not running. Start with: ollama serve');
    process.exit(1);
  }

  console.log('Loading embeddings...');
  const paperEmbeddings = loadEmbeddings();
  console.log(`Loaded ${paperEmbeddings.size} paper embeddings`);

  console.log('Loading papers...');
  const papers = loadPapers();
  console.log(`Loaded ${papers.size} papers\n`);

  // Generate topic embeddings
  console.log('Generating topic embeddings...');
  const topicEmbeddings = new Map<string, Map<string, number[]>>();

  for (const [category, topics] of Object.entries(TOPICS)) {
    topicEmbeddings.set(category, new Map());
    for (const [name, description] of Object.entries(topics)) {
      const emb = await getEmbedding(description);
      topicEmbeddings.get(category)!.set(name, emb);
      process.stdout.write('.');
    }
  }
  console.log(' done\n');

  // Score each paper
  console.log('Scoring papers...\n');

  const results: { id: string; labels: Record<string, string[]>; scores: Record<string, Record<string, number>> }[] = [];

  for (const [id, paperEmb] of paperEmbeddings) {
    const paper = papers.get(id);
    if (!paper) continue;

    const labels: Record<string, string[]> = {};
    const scores: Record<string, Record<string, number>> = {};

    for (const [category, topics] of topicEmbeddings) {
      labels[category] = [];
      scores[category] = {};

      // Calculate all scores
      for (const [name, topicEmb] of topics) {
        const sim = cosineSimilarity(paperEmb, topicEmb);
        scores[category][name] = sim;
      }

      // Best-match: take top scorer if above threshold, optionally 2nd if close
      const sorted = Object.entries(scores[category])
        .sort((a, b) => b[1] - a[1]);

      if (sorted.length > 0 && sorted[0][1] >= minThreshold) {
        labels[category].push(sorted[0][0]);
        // Include 2nd place if within gap
        if (sorted.length > 1 && sorted[1][1] >= minThreshold &&
            sorted[0][1] - sorted[1][1] <= secondPlaceGap) {
          labels[category].push(sorted[1][0]);
        }
      }
    }

    results.push({ id, labels, scores });
  }

  // Print distribution
  const labelCounts: Record<string, Record<string, number>> = {};
  for (const category of Object.keys(TOPICS)) {
    labelCounts[category] = {};
    for (const topic of Object.keys(TOPICS[category as keyof typeof TOPICS])) {
      labelCounts[category][topic] = 0;
    }
  }

  for (const result of results) {
    for (const [category, labels] of Object.entries(result.labels)) {
      for (const label of labels) {
        labelCounts[category][label]++;
      }
    }
  }

  console.log('=== Label Distribution ===\n');
  for (const [category, counts] of Object.entries(labelCounts)) {
    console.log(`${category.toUpperCase()}:`);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    for (const [label, count] of sorted) {
      const pct = ((count / results.length) * 100).toFixed(0);
      const bar = '█'.repeat(Math.ceil(count / results.length * 30));
      console.log(`  ${label.padEnd(20)} ${String(count).padStart(4)} (${pct.padStart(2)}%) ${bar}`);
    }
    console.log('');
  }

  // Show samples
  console.log('=== Top Matches per Label ===\n');
  for (const [category, topics] of Object.entries(TOPICS)) {
    for (const topic of Object.keys(topics)) {
      const matching = results
        .filter(r => r.labels[category]?.includes(topic))
        .sort((a, b) => b.scores[category][topic] - a.scores[category][topic])
        .slice(0, 2);

      if (matching.length > 0) {
        console.log(`${category}:${topic}`);
        for (const m of matching) {
          const paper = papers.get(m.id)?.data;
          const title = (paper?.title || '').slice(0, 55);
          const score = m.scores[category][topic].toFixed(2);
          console.log(`  [${score}] ${title}...`);
        }
      }
    }
    console.log('');
  }

  // Save if not dry run
  if (!dryRun) {
    console.log('=== Saving Labels ===\n');
    let updated = 0;

    for (const result of results) {
      const paper = papers.get(result.id);
      if (!paper) continue;

      const allLabels: string[] = [];
      for (const [category, labels] of Object.entries(result.labels)) {
        for (const label of labels) {
          allLabels.push(`${category}:${label}`);
        }
      }

      if (allLabels.length === 0) continue;

      // Keep existing non-auto tags, add new auto tags
      const existingTags = (paper.data.tags || []).filter(t => !t.includes(':'));
      const newTags = [...new Set([...existingTags, ...allLabels])];

      paper.data.tags = newTags;
      const content = yaml.dump(paper.data, { lineWidth: -1, quotingType: '"', forceQuotes: false });
      fs.writeFileSync(paper.path, content);
      updated++;
    }

    console.log(`Updated ${updated} papers with auto-labels`);
  } else {
    console.log('Dry run - no files modified');
  }
}

main().catch(console.error);
