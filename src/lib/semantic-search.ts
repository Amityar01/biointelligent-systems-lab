/**
 * Semantic search utilities for publications
 * Uses pre-computed embeddings with cosine similarity
 * Falls back to keyword search for papers without embeddings
 */

import type { Publication } from './content';

interface EmbeddingEntry {
  id: string;
  embedding: number[];
}

let embeddingsCache: Map<string, number[]> | null = null;
let embeddingsLoading: Promise<void> | null = null;

/**
 * Load embeddings from the public folder
 * Caches results to avoid repeated fetches
 */
export async function loadEmbeddings(): Promise<Map<string, number[]>> {
  if (embeddingsCache) {
    return embeddingsCache;
  }

  // Prevent multiple simultaneous loads
  if (embeddingsLoading) {
    await embeddingsLoading;
    return embeddingsCache || new Map();
  }

  embeddingsLoading = (async () => {
    try {
      const response = await fetch('/embeddings.json');
      if (!response.ok) {
        console.warn('Embeddings not found, using keyword search only');
        embeddingsCache = new Map();
        return;
      }

      const data: EmbeddingEntry[] = await response.json();
      embeddingsCache = new Map(data.map(e => [e.id, e.embedding]));
      console.log(`Loaded ${embeddingsCache.size} embeddings`);
    } catch (err) {
      console.warn('Failed to load embeddings:', err);
      embeddingsCache = new Map();
    }
  })();

  await embeddingsLoading;
  return embeddingsCache || new Map();
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Simple keyword matching score
 * Returns a score between 0 and 1
 */
export function keywordScore(query: string, text: string): number {
  if (!query || !text) return 0;

  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const textLower = text.toLowerCase();

  if (queryTerms.length === 0) return 0;

  let matches = 0;
  for (const term of queryTerms) {
    if (textLower.includes(term)) {
      matches++;
    }
  }

  return matches / queryTerms.length;
}

// Re-export Publication from content for consistency
export type { Publication } from './content';

export interface SearchResult {
  publication: Publication;
  score: number;
  matchType: 'semantic' | 'keyword';
}

/**
 * Search publications using hybrid semantic + keyword approach
 *
 * @param query - Search query string
 * @param publications - Array of publications to search
 * @param queryEmbedding - Optional pre-computed embedding for the query
 * @param embeddings - Map of publication ID to embedding vector
 * @param threshold - Minimum similarity score (0-1) for semantic matches
 */
export function hybridSearch(
  query: string,
  publications: Publication[],
  queryEmbedding: number[] | null,
  embeddings: Map<string, number[]>,
  threshold: number = 0.3
): SearchResult[] {
  if (!query.trim()) {
    return publications.map(p => ({
      publication: p,
      score: 1,
      matchType: 'keyword' as const,
    }));
  }

  const results: SearchResult[] = [];

  for (const pub of publications) {
    const pubEmbedding = embeddings.get(pub.id);

    // Try semantic search first if we have embeddings
    if (queryEmbedding && pubEmbedding) {
      const similarity = cosineSimilarity(queryEmbedding, pubEmbedding);
      if (similarity >= threshold) {
        results.push({
          publication: pub,
          score: similarity,
          matchType: 'semantic',
        });
        continue;
      }
    }

    // Fall back to keyword search
    const searchText = [
      pub.title || '',
      pub.authors?.join(' ') || '',
      pub.journal || '',
      pub.tags?.join(' ') || '',
    ].join(' ');

    const kwScore = keywordScore(query, searchText);
    if (kwScore > 0) {
      results.push({
        publication: pub,
        score: kwScore * 0.8, // Slightly lower weight for keyword matches
        matchType: 'keyword',
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

// Target dimension for truncated embeddings (must match compressed embeddings)
const TARGET_DIM = 1024;

/**
 * Get query embedding from Ollama (for local development)
 * Truncates to TARGET_DIM dimensions to match pre-computed embeddings
 */
export async function getQueryEmbedding(query: string): Promise<number[] | null> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Try to get embedding from local Ollama
    const response = await fetch('http://localhost:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3-embedding:8b',
        prompt: query,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // Truncate to match pre-computed embedding dimensions
    return data.embedding?.slice(0, TARGET_DIM) || null;
  } catch {
    // Ollama not available, will use keyword search
    return null;
  }
}
