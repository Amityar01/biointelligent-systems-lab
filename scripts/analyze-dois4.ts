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

console.log('=== Actually searchable papers ===\n');

for (const file of files) {
  const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8')) as Pub;
  if (data.doi) continue;
  if (isJapanese(data.title || '')) continue;
  if (data.tags?.includes('japanese')) continue;

  console.log(`Title: ${data.title}`);
  console.log(`Journal: ${data.journal || 'none'}`);
  console.log(`Type: ${data.type} | Year: ${data.year} | Tags: ${data.tags?.join(', ') || 'none'}`);
  console.log('');
}
