/**
 * Generate embeddings for publications using Ollama
 *
 * Usage: npx tsx scripts/generate-embeddings.ts [--force]
 *   --force  Regenerate all embeddings (use after fetching new abstracts)
 *
 * Requires Ollama running locally:
 *   ollama serve
 *   ollama pull qwen3-embedding:8b
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'qwen3-embedding:8b';
// Truncate to this dimension for smaller file size (MRL/Matryoshka allows this)
const TARGET_DIM = 1024;

interface Publication {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  type?: string;
  tags?: string[];
  doi?: string;
  volume?: string;
  pages?: string;
  pubmed?: string;
  abstract?: string;
}

interface EmbeddingEntry {
  id: string;
  embedding: number[];
}

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json();
  // Truncate to TARGET_DIM and round to 4 decimal places for smaller file size
  return data.embedding
    .slice(0, TARGET_DIM)
    .map((v: number) => Math.round(v * 10000) / 10000);
}

function loadPublications(): Publication[] {
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const publications: Publication[] = [];

  if (!fs.existsSync(pubsDir)) {
    console.error('Publications directory not found:', pubsDir);
    return [];
  }

  const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(pubsDir, file), 'utf-8');
      const data = yaml.load(content) as Publication | Publication[];

      if (Array.isArray(data)) {
        publications.push(...data);
      } else if (data) {
        publications.push(data);
      }
    } catch (err) {
      console.error(`Error loading ${file}:`, err);
    }
  }

  return publications;
}

function loadExistingEmbeddings(): Map<string, number[]> {
  const embeddingsPath = path.join(process.cwd(), 'public', 'embeddings.json');
  const map = new Map<string, number[]>();

  if (fs.existsSync(embeddingsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8')) as EmbeddingEntry[];
      for (const entry of data) {
        map.set(entry.id, entry.embedding);
      }
      console.log(`Loaded ${map.size} existing embeddings`);
    } catch (err) {
      console.error('Error loading existing embeddings:', err);
    }
  }

  return map;
}

function createSearchText(pub: Publication): string {
  const parts = [
    pub.title || '',
    pub.authors?.join(', ') || '',
    pub.journal || '',
    pub.tags?.join(' ') || '',
    pub.abstract || '',
  ];
  return parts.filter(Boolean).join('. ');
}

async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes('--force');

  console.log('=== Publication Embedding Generator ===\n');
  if (forceAll) console.log('Force mode: regenerating all embeddings\n');

  // Load publications
  console.log('Loading publications...');
  const publications = loadPublications();
  console.log(`Found ${publications.length} publications\n`);

  if (publications.length === 0) {
    console.error('No publications found!');
    process.exit(1);
  }

  // Load existing embeddings
  const existingEmbeddings = forceAll ? new Map() : loadExistingEmbeddings();

  // Check Ollama is running
  try {
    const health = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!health.ok) throw new Error('Ollama not responding');
    console.log(`Ollama is running, using model: ${MODEL}\n`);
  } catch {
    console.error('Error: Ollama is not running. Start it with: ollama serve');
    process.exit(1);
  }

  // Find publications needing embeddings (or with wrong dimension)
  const needsEmbedding = publications.filter(p => {
    const existing = existingEmbeddings.get(p.id);
    return !existing || existing.length !== TARGET_DIM;
  });
  console.log(`Publications needing embeddings: ${needsEmbedding.length}`);
  console.log(`Publications with valid embeddings: ${publications.length - needsEmbedding.length}\n`);

  if (needsEmbedding.length === 0) {
    console.log('All publications already have embeddings. Nothing to do.');
    return;
  }

  // Generate embeddings for new publications
  console.log('Generating embeddings...\n');
  const results: EmbeddingEntry[] = [];

  // Keep existing embeddings (truncate if needed)
  for (const pub of publications) {
    const existing = existingEmbeddings.get(pub.id);
    if (existing) {
      const truncated = existing.length > TARGET_DIM
        ? existing.slice(0, TARGET_DIM).map((v: number) => Math.round(v * 10000) / 10000)
        : existing;
      results.push({ id: pub.id, embedding: truncated });
    }
  }

  // Generate new embeddings
  for (let i = 0; i < needsEmbedding.length; i++) {
    const pub = needsEmbedding[i];
    const searchText = createSearchText(pub);

    try {
      const title = pub.title?.slice(0, 60) || pub.id;
      console.log(`[${i + 1}/${needsEmbedding.length}] ${title}...`);

      const embedding = await getEmbedding(searchText);
      results.push({ id: pub.id, embedding });
    } catch (err) {
      console.error(`  Error: ${err}`);
    }

    // Small delay to avoid overwhelming Ollama
    if (i < needsEmbedding.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Save embeddings to public folder (accessible at runtime)
  const outputPath = path.join(process.cwd(), 'public', 'embeddings.json');
  fs.writeFileSync(outputPath, JSON.stringify(results));

  const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`\n✓ Saved ${results.length} embeddings to public/embeddings.json (${fileSizeKB} KB)`);
}

main().catch(console.error);
