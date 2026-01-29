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

function isJapaneseConference(pub: Pub): boolean {
  if (isJapanese(pub.title || '')) return true;

  const journal = pub.journal?.toLowerCase() || '';
  const jpPatterns = ['学会', '大会', '研究会', 'シンポジウム', '講演', '発表', '日本', '電子情報通信', '計測自動制御', '機械学会'];
  for (const pattern of jpPatterns) {
    if (journal.includes(pattern)) return true;
  }

  if (pub.tags?.includes('japanese')) return true;
  return false;
}

let noDoi = 0;
let jpByTitle = 0;
let jpByJournal = 0;
let jpByTag = 0;
let englishSearchable = 0;

const searchable: Pub[] = [];

for (const file of files) {
  const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8')) as Pub;
  if (data.doi) continue;
  noDoi++;

  // Check why it would be filtered
  if (isJapanese(data.title || '')) {
    jpByTitle++;
  } else if (data.tags?.includes('japanese')) {
    jpByTag++;
  } else {
    const journal = data.journal?.toLowerCase() || '';
    const jpPatterns = ['学会', '大会', '研究会', 'シンポジウム', '講演', '発表', '日本', '電子情報通信', '計測自動制御', '機械学会'];
    let foundJp = false;
    for (const p of jpPatterns) {
      if (journal.includes(p)) { jpByJournal++; foundJp = true; break; }
    }
    if (!foundJp) {
      englishSearchable++;
      searchable.push(data);
    }
  }
}

console.log('=== Why papers are filtered ===');
console.log('Total without DOI:', noDoi);
console.log('Filtered by Japanese title:', jpByTitle);
console.log('Filtered by japanese tag:', jpByTag);
console.log('Filtered by Japanese journal:', jpByJournal);
console.log('Searchable (English):', englishSearchable);
console.log('');
console.log('=== Searchable papers by type ===');
const byType: Record<string, number> = {};
searchable.forEach(p => { byType[p.type || 'unknown'] = (byType[p.type || 'unknown'] || 0) + 1; });
Object.entries(byType).sort((a,b) => b[1]-a[1]).forEach(([t, c]) => console.log(`  ${t}: ${c}`));
