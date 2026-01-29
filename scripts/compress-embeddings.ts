/**
 * Compress embeddings by reducing dimensions and precision
 * Matryoshka/MRL embeddings allow dimension truncation with minimal quality loss
 */

import fs from 'fs';
import path from 'path';

interface EmbeddingEntry {
  id: string;
  embedding: number[];
}

// Truncate to this many dimensions (must be power of 2 for MRL models)
const TARGET_DIM = 1024;

function main() {
  const inputPath = path.join(process.cwd(), 'public', 'embeddings.json');
  const outputPath = path.join(process.cwd(), 'public', 'embeddings.json');

  console.log('Loading embeddings...');
  const data: EmbeddingEntry[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const originalDim = data[0]?.embedding.length || 0;

  console.log(`Original: ${data.length} embeddings, ${originalDim} dimensions`);
  console.log(`Target: ${TARGET_DIM} dimensions`);

  // Truncate dimensions and round to 4 decimal places
  const compressed = data.map(entry => ({
    id: entry.id,
    embedding: entry.embedding.slice(0, TARGET_DIM).map(v => Math.round(v * 10000) / 10000),
  }));

  // Write without pretty-printing
  fs.writeFileSync(outputPath, JSON.stringify(compressed));

  const newSize = fs.statSync(outputPath).size / (1024 * 1024);
  console.log(`\nCompressed: ${newSize.toFixed(1)} MB`);
}

main();
