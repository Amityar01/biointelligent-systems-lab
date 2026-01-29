import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const pubsDir = path.join(process.cwd(), 'content', 'publications');
const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml'));

let withLabels = 0;
let withoutLabels = 0;
const missing2025: string[] = [];

for (const file of files) {
  try {
    const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8')) as any;
    const hasAutoLabel = data.tags?.some((t: string) => t.includes(':'));

    if (hasAutoLabel) {
      withLabels++;
    } else {
      withoutLabels++;
      if (data.year === 2025) {
        missing2025.push(data.title?.slice(0, 60) || file);
      }
    }
  } catch {}
}

console.log('Total:', withLabels + withoutLabels);
console.log('With auto-labels:', withLabels);
console.log('Without auto-labels:', withoutLabels);
console.log('\n2025 papers without labels:');
missing2025.forEach(t => console.log(' -', t));
