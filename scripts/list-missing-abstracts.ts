import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const pubsDir = path.join(process.cwd(), 'content', 'publications');
const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml'));

let withAbs = 0;
const missing: { year: number; title: string; doi: string }[] = [];

for (const file of files) {
  try {
    const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8'), { schema: yaml.JSON_SCHEMA }) as any;
    if (data.type === 'journal' || data.type === 'conference') {
      if (data.abstract) {
        withAbs++;
      } else {
        missing.push({
          year: data.year || 0,
          title: (data.title || '').slice(0, 55),
          doi: data.doi ? 'Y' : 'N'
        });
      }
    }
  } catch {}
}

missing.sort((a, b) => b.year - a.year);
console.log(`Journal/Conference: ${withAbs} with abstract, ${missing.length} without\n`);
console.log('Missing abstracts:');
for (const p of missing) {
  console.log(`[${p.year || '?'}] DOI:${p.doi} ${p.title}`);
}
