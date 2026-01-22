/**
 * Fast Regex-Based Parser - No LLM needed
 * Parses awards, grants, media, theses in seconds
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCHES_DIR = path.join(__dirname, '..', 'scraped', 'batches');
const OUTPUT_DIR = path.join(__dirname, '..', 'scraped', 'parsed');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Parse awards - format: "(#) Award details, Year"
function parseAward(raw: string, idx: number) {
  const yearMatch = raw.match(/[,，]\s*(\d{4})年?[度]?[）)月日\s]*(?:受賞)?[）)]*$/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

  // Extract names before colon or 「
  const nameMatch = raw.match(/^\(\d+\)\s*(.+?)[:：「]/);
  const recipients = nameMatch ? nameMatch[1].split(/[,，、]/).map(n => n.trim()).filter(n => n && !n.includes('賞')) : [];

  // Extract award name - usually in 「」 or after certain keywords
  const awardMatch = raw.match(/「([^」]+)」/) || raw.match(/第\d+回[^,，]+賞/);
  const awardName = awardMatch ? (awardMatch[1] || awardMatch[0]) : '';

  return {
    id: `award-${idx}`,
    awardName: awardName || raw.substring(0, 100),
    recipients,
    year,
    _raw: raw,
    _valid: true
  };
}

// Parse grants - format: "(#) Name (代表者): Title, Funder, Year"
function parseGrant(raw: string, idx: number) {
  // Extract PI
  const piMatch = raw.match(/^\(\d+\)\s*([^(（]+)\s*[（(]代表者[)）]/);
  const pi = piMatch ? piMatch[1].trim() : '';

  // Extract co-PIs
  const coPiMatch = raw.match(/[（(]分担[者研究]*[)）]/);
  const hasCoPi = !!coPiMatch;

  // Extract title - usually in 「」
  const titleMatch = raw.match(/「([^」]+)」/);
  const title = titleMatch ? titleMatch[1] : '';

  // Extract funder
  const funderMatch = raw.match(/[，,]\s*(科学研究費|科学技術振興機構|JST|厚生労働|総務省|国立研究開発法人|東京大学)[^，,]*/);
  const funder = funderMatch ? funderMatch[0].replace(/^[，,]\s*/, '') : '';

  // Extract years
  const yearMatch = raw.match(/(\d{4})年度[～~](\d{4})?年度?/);
  const startYear = yearMatch ? parseInt(yearMatch[1]) : undefined;
  const endYear = yearMatch && yearMatch[2] ? parseInt(yearMatch[2]) : startYear;

  return {
    id: `grant-${idx}`,
    title,
    pi: pi || '高橋宏知',
    funder,
    startYear,
    endYear,
    role: pi ? 'PI' : (hasCoPi ? 'Co-PI' : 'PI'),
    _raw: raw,
    _valid: !!title
  };
}

// Parse media - format: "(#) Title, Source, Date"
function parseMedia(raw: string, idx: number) {
  // Extract date
  const dateMatch = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})?日?[掲載放送配信発行]*$/);
  const year = dateMatch ? parseInt(dateMatch[1]) : undefined;
  const month = dateMatch ? parseInt(dateMatch[2]) : undefined;
  const day = dateMatch && dateMatch[3] ? parseInt(dateMatch[3]) : undefined;

  // Extract title - usually in 「」
  const titleMatch = raw.match(/「([^」]+)」/);
  const title = titleMatch ? titleMatch[1] : '';

  // Extract source - between title and date
  const sourceMatch = raw.match(/」[，,]\s*([^，,]+?)[，,]\s*\d{4}年/);
  const source = sourceMatch ? sourceMatch[1].trim() : '';

  // Determine type
  const type = raw.includes('放送') ? 'tv' :
               raw.includes('新聞') ? 'newspaper' :
               raw.includes('配信') ? 'web' : 'other';

  return {
    id: `media-${idx}`,
    title,
    source,
    year,
    month,
    day,
    type,
    _raw: raw,
    _valid: !!title || !!source
  };
}

// Parse theses - format varies
function parseThesis(raw: string, idx: number) {
  // Extract year
  const yearMatch = raw.match(/(\d{4})年度?/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

  // Extract degree type
  const degree = raw.includes('博士') ? 'phd' :
                 raw.includes('修士') ? 'master' :
                 raw.includes('卒業') || raw.includes('学士') ? 'bachelor' : 'unknown';

  // Extract name and title - usually "Name: Title"
  const parts = raw.split(/[:：]/);
  const name = parts[0]?.replace(/^\(\d+\)\s*/, '').trim() || '';
  const title = parts[1]?.trim() || '';

  return {
    id: `thesis-${idx}`,
    name,
    title,
    degree,
    year,
    _raw: raw,
    _valid: !!name
  };
}

// Parse posters - simpler format
function parsePoster(raw: string, idx: number) {
  const yearMatch = raw.match(/(\d{4})年?/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

  const titleMatch = raw.match(/「([^」]+)」/);
  const title = titleMatch ? titleMatch[1] : '';

  // Extract authors before 「
  const authorsMatch = raw.match(/^\(\d+\)\s*([^「]+)「/);
  const authors = authorsMatch ?
    authorsMatch[1].split(/[,，、]/).map(a => a.trim()).filter(a => a && a.length < 20) : [];

  return {
    id: `poster-${idx}`,
    title,
    authors,
    year,
    _raw: raw,
    _valid: !!title || authors.length > 0
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Fast Regex Parser (No LLM)');
  console.log('='.repeat(60));

  const configs = [
    { batches: [66, 67], category: 'award', parser: parseAward },
    { batches: [68, 69], category: 'grant', parser: parseGrant },
    { batches: [70, 71, 72, 73], category: 'media', parser: parseMedia },
    { batches: [74, 75, 76, 77, 78, 79, 80], category: 'thesis', parser: parseThesis },
    { batches: [55, 56, 57, 58, 59, 60, 61, 62, 63], category: 'poster', parser: parsePoster },
    { batches: [64], category: 'report', parser: parsePoster },
  ];

  for (const config of configs) {
    let allItems: any[] = [];
    let globalIdx = 1;

    for (const batchNum of config.batches) {
      const batchFile = `batch-${String(batchNum).padStart(3, '0')}.json`;
      const batchPath = path.join(BATCHES_DIR, batchFile);

      if (!fs.existsSync(batchPath)) continue;

      const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
      console.log(`\n[${batchFile}] ${batch.items.length} ${config.category}s`);

      for (const raw of batch.items) {
        const parsed = config.parser(raw, globalIdx++);
        allItems.push(parsed);
      }
    }

    if (allItems.length === 0) continue;

    const validCount = allItems.filter(i => i._valid).length;
    console.log(`  Total: ${allItems.length}, Valid: ${validCount}`);

    // Save combined output
    const outPath = path.join(OUTPUT_DIR, `${config.category}s-all.json`);
    fs.writeFileSync(outPath, JSON.stringify({
      category: config.category,
      parsedAt: new Date().toISOString(),
      items: allItems,
      stats: { total: allItems.length, valid: validCount }
    }, null, 2));
    console.log(`  Saved: ${outPath}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Done!');
}

main().catch(console.error);
