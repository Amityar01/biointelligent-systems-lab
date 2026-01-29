/**
 * Cluster papers using embeddings to discover natural topic groups
 *
 * Usage: npx tsx scripts/cluster-papers.ts [num-clusters]
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const NUM_CLUSTERS = parseInt(process.argv[2] || '12');
const MAX_ITERATIONS = 100;

interface Paper {
  id: string;
  title: string;
  authors?: string[];
  year?: number;
  type?: string;
  journal?: string;
  conference?: string;
  abstract?: string;
}

interface EmbeddingEntry {
  id: string;
  embedding: number[];
}

interface Cluster {
  centroid: number[];
  papers: { paper: Paper; distance: number }[];
}

// Load embeddings
function loadEmbeddings(): Map<string, number[]> {
  const embPath = path.join(process.cwd(), 'public', 'embeddings.json');
  const data = JSON.parse(fs.readFileSync(embPath, 'utf-8')) as EmbeddingEntry[];
  const map = new Map<string, number[]>();
  for (const entry of data) {
    map.set(entry.id, entry.embedding);
  }
  return map;
}

// Load paper metadata
function loadPapers(): Map<string, Paper> {
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const papers = new Map<string, Paper>();

  const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml'));
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(pubsDir, file), 'utf-8');
      const data = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as Paper;
      if (data?.id) {
        papers.set(data.id, data);
      }
    } catch {}
  }
  return papers;
}

// Cosine distance (1 - similarity)
function cosineDistance(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return 1 - sim;
}

// Compute centroid of vectors
function computeCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const centroid = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += v[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    centroid[i] /= vectors.length;
  }
  return centroid;
}

// K-means clustering
function kMeans(embeddings: Map<string, number[]>, k: number): Map<string, number> {
  const ids = Array.from(embeddings.keys());
  const vectors = ids.map(id => embeddings.get(id)!);

  // Initialize centroids randomly (pick k random points)
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  let centroids = shuffled.slice(0, k).map(id => [...embeddings.get(id)!]);

  let assignments = new Map<string, number>();

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const newAssignments = new Map<string, number>();

    // Assign each point to nearest centroid
    for (let i = 0; i < ids.length; i++) {
      let minDist = Infinity;
      let minCluster = 0;
      for (let c = 0; c < k; c++) {
        const dist = cosineDistance(vectors[i], centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          minCluster = c;
        }
      }
      newAssignments.set(ids[i], minCluster);
    }

    // Check convergence
    let changed = false;
    for (const [id, cluster] of newAssignments) {
      if (assignments.get(id) !== cluster) {
        changed = true;
        break;
      }
    }
    assignments = newAssignments;

    if (!changed) {
      console.log(`Converged after ${iter + 1} iterations\n`);
      break;
    }

    // Recompute centroids
    const clusterVectors: number[][][] = Array.from({ length: k }, () => []);
    for (let i = 0; i < ids.length; i++) {
      const cluster = assignments.get(ids[i])!;
      clusterVectors[cluster].push(vectors[i]);
    }

    for (let c = 0; c < k; c++) {
      if (clusterVectors[c].length > 0) {
        centroids[c] = computeCentroid(clusterVectors[c]);
      }
    }
  }

  return assignments;
}

// Extract common words from titles for topic suggestion
function suggestTopic(papers: Paper[]): string[] {
  const words = new Map<string, number>();
  const stopWords = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'for', 'and', 'to', 'with', 'by', 'at', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'that', 'this', 'it', 'its', 'or', 'but', 'not', 'no', 'can', 'will', 'do', 'did', 'has', 'have', 'had', 'may', 'might', 'must', 'shall', 'should', 'would', 'could', 'using', 'based', 'study', 'analysis', 'effect', 'effects', 'new', 'novel', 'method', 'approach', 'system', 'model', 'data', 'results', 'during', 'between', 'through', 'into', 'about', 'over', 'under', 'after', 'before']);

  for (const paper of papers) {
    const title = (paper.title || '').toLowerCase();
    const tokens = title.split(/[^a-z]+/).filter(w => w.length > 2 && !stopWords.has(w));
    for (const token of tokens) {
      words.set(token, (words.get(token) || 0) + 1);
    }
  }

  return Array.from(words.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

// Main
async function main() {
  console.log(`=== Paper Clustering ===\n`);
  console.log(`Loading data...`);

  const embeddings = loadEmbeddings();
  const papers = loadPapers();

  console.log(`Papers: ${papers.size}`);
  console.log(`Embeddings: ${embeddings.size}`);
  console.log(`Clusters: ${NUM_CLUSTERS}\n`);

  console.log(`Running k-means...`);
  const assignments = kMeans(embeddings, NUM_CLUSTERS);

  // Build cluster info
  const clusters: { papers: Paper[]; ids: string[] }[] = Array.from({ length: NUM_CLUSTERS }, () => ({ papers: [], ids: [] }));

  for (const [id, cluster] of assignments) {
    const paper = papers.get(id);
    if (paper) {
      clusters[cluster].papers.push(paper);
      clusters[cluster].ids.push(id);
    }
  }

  // Sort clusters by size
  const sorted = clusters
    .map((c, i) => ({ ...c, index: i }))
    .sort((a, b) => b.papers.length - a.papers.length);

  // Print results
  console.log(`=== Clusters ===\n`);

  for (const cluster of sorted) {
    if (cluster.papers.length === 0) continue;

    const keywords = suggestTopic(cluster.papers);
    const types = new Map<string, number>();
    for (const p of cluster.papers) {
      const t = p.type || 'unknown';
      types.set(t, (types.get(t) || 0) + 1);
    }
    const topTypes = Array.from(types.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

    console.log(`--- Cluster ${cluster.index + 1} (${cluster.papers.length} papers) ---`);
    console.log(`Keywords: ${keywords.join(', ')}`);
    console.log(`Types: ${topTypes.map(([t, n]) => `${t}(${n})`).join(', ')}`);
    console.log(`\nSample papers:`);

    // Show sample papers (prefer journals/conferences with abstracts)
    const samples = cluster.papers
      .filter(p => p.type === 'journal' || p.type === 'conference')
      .slice(0, 3);
    if (samples.length < 3) {
      samples.push(...cluster.papers.filter(p => !samples.includes(p)).slice(0, 3 - samples.length));
    }

    for (const paper of samples) {
      const year = paper.year || '?';
      const title = (paper.title || '').slice(0, 70);
      console.log(`  [${year}] ${title}${paper.title && paper.title.length > 70 ? '...' : ''}`);
    }
    console.log('');
  }

  // Suggest topic descriptions for embedding
  console.log(`=== Suggested Topic Descriptions ===\n`);
  console.log(`Use these with embeddings to auto-label papers:\n`);

  for (const cluster of sorted.slice(0, 10)) {
    if (cluster.papers.length < 5) continue;
    const keywords = suggestTopic(cluster.papers);
    const topKeywords = keywords.slice(0, 4).join(' ');
    console.log(`- "${topKeywords}"`);
  }
}

main().catch(console.error);
