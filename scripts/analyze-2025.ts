import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'qwen3-embedding:8b';
const TARGET_DIM = 1024;

const TOPICS: Record<string, Record<string, string>> = {
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

async function main() {
  // Load embeddings
  const embeddings = JSON.parse(fs.readFileSync('public/embeddings.json', 'utf-8'));
  const embMap = new Map<string, number[]>(embeddings.map((e: any) => [e.id, e.embedding]));

  // Load 2025 papers without labels
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml'));
  const papers2025NoLabel: any[] = [];

  for (const file of files) {
    const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8')) as any;
    if (data.year === 2025 && !data.tags?.some((t: string) => t.includes(':'))) {
      papers2025NoLabel.push({ file, ...data });
    }
  }

  console.log('2025 papers without labels:', papers2025NoLabel.length);

  // Generate topic embeddings
  console.log('\nGenerating topic embeddings...');
  const topicEmbs: Record<string, Record<string, number[]>> = {};
  for (const [cat, topics] of Object.entries(TOPICS)) {
    topicEmbs[cat] = {};
    for (const [name, desc] of Object.entries(topics)) {
      topicEmbs[cat][name] = await getEmbedding(desc);
    }
  }
  console.log('done\n');

  // Check each paper
  for (const paper of papers2025NoLabel) {
    console.log('---');
    console.log('Title:', paper.title?.slice(0, 70));
    console.log('Type:', paper.type, '| Abstract:', paper.abstract ? `${paper.abstract.length} chars` : 'NO');

    const emb = embMap.get(paper.id);
    if (!emb) {
      console.log('ERROR: No embedding found for', paper.id);
      continue;
    }

    // Find best scores per category
    for (const [cat, topics] of Object.entries(topicEmbs)) {
      const scores: { name: string; sim: number }[] = [];
      for (const [name, topicEmb] of Object.entries(topics)) {
        const sim = cosineSim(emb, topicEmb);
        scores.push({ name, sim });
      }
      scores.sort((a, b) => b.sim - a.sim);
      const best = scores[0];
      const marker = best.sim < 0.5 ? ' ✗' : ' ✓';
      console.log(`  ${cat}: ${best.name} (${best.sim.toFixed(2)})${marker}`);
    }
    console.log('');
  }
}

main().catch(console.error);
