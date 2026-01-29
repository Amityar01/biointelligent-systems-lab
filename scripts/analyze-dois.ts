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

let withDoi = 0;
let noDoi = 0;
let jpTitle = 0;
let enTitle = 0;
const enPapers: Pub[] = [];

for (const file of files) {
  const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8')) as Pub;
  if (data.doi) { withDoi++; continue; }
  noDoi++;

  if (isJapanese(data.title || '')) {
    jpTitle++;
  } else {
    enTitle++;
    enPapers.push(data);
  }
}

console.log('=== Papers without DOI ===');
console.log('Total:', noDoi);
console.log('Japanese title:', jpTitle);
console.log('English title:', enTitle);
console.log('');
console.log('=== English papers without DOI ===');
enPapers.forEach(p => {
  console.log(`- ${p.title?.slice(0,60)}`);
  console.log(`  Journal: ${p.journal?.slice(0,40) || 'none'} | Year: ${p.year} | Type: ${p.type}`);
});
