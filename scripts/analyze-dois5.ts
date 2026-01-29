import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const pubsDir = path.join(process.cwd(), 'content', 'publications');
const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml'));

interface Pub {
  title?: string;
  journal?: string;
  doi?: string;
  tags?: string[];
  type?: string;
  year?: number;
}

function isJapanese(text: string): boolean {
  if (!text) return false;
  const jpChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
  return jpChars / text.length > 0.3;
}

console.log('=== English papers with japanese tag that have journals ===\n');

let count = 0;
let withJournal = 0;
const journals: Record<string, number> = {};

for (const file of files) {
  const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8')) as Pub;
  if (data.doi) continue;
  if (isJapanese(data.title || '')) continue;
  if (!data.tags?.includes('japanese')) continue;

  count++;
  if (data.journal) {
    withJournal++;
    journals[data.journal] = (journals[data.journal] || 0) + 1;
  }
}

console.log(`Total English-titled with japanese tag: ${count}`);
console.log(`With journal name: ${withJournal}`);
console.log(`Without journal: ${count - withJournal}`);
console.log('');
console.log('=== Journals ===');
Object.entries(journals).sort((a,b) => b[1] - a[1]).forEach(([j, c]) => {
  console.log(`  ${c}x ${j}`);
});
