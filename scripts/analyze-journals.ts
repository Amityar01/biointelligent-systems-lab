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

console.log('=== Journal-type papers without DOI ===\n');
let count = 0;
for (const file of files) {
  const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8')) as Pub;
  if (data.doi) continue;
  if (data.type !== 'journal') continue;
  count++;
  console.log(`Title: ${data.title?.slice(0,70)}`);
  console.log(`Journal: ${data.journal || 'none'}`);
  console.log(`Year: ${data.year} | Tags: ${data.tags?.join(', ')}`);
  console.log('');
}
console.log(`Total: ${count} journal papers without DOI`);
