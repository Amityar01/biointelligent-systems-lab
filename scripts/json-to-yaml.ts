/**
 * Convert translated JSON files to bilingual YAML for CMS
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
// Simple YAML serializer (no external dependency)
function toYaml(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let result = '';

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        result += `${spaces}-\n`;
        const inner = toYaml(item, indent + 1);
        result += inner.split('\n').map(line => line ? `${spaces}  ${line.trimStart()}` : '').join('\n').trimEnd() + '\n';
      } else {
        result += `${spaces}- ${JSON.stringify(item)}\n`;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null || value === '') continue;
      if (typeof value === 'object' && !Array.isArray(value)) {
        result += `${spaces}${key}:\n${toYaml(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        result += `${spaces}${key}:\n${toYaml(value, indent + 1)}`;
      } else if (typeof value === 'string' && (value.includes('\n') || value.includes(':'))) {
        result += `${spaces}${key}: "${value.replace(/"/g, '\\"')}"\n`;
      } else if (typeof value === 'string') {
        result += `${spaces}${key}: "${value}"\n`;
      } else {
        result += `${spaces}${key}: ${value}\n`;
      }
    }
  }
  return result;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRANSLATED_DIR = path.join(__dirname, '..', 'scraped', 'translated');
const CONTENT_DIR = path.join(__dirname, '..', 'content');

// Convert awards
function convertAwards() {
  const inputPath = path.join(TRANSLATED_DIR, 'awards-translated.json');
  if (!fs.existsSync(inputPath)) return;

  console.log('[Awards] Converting to YAML...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  const awards = data.items.map((item: any, idx: number) => ({
    id: `award-${idx + 1}`,
    title: item.awardName_ja ? {
      ja: item.awardName_ja,
      en: item.awardName_en
    } : item.awardName_en || item.awardName,
    recipients: item.recipients || [],
    year: item.year,
  })).filter((a: any) => a.title);

  const outputDir = path.join(CONTENT_DIR, 'awards');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'awards.yaml');
  fs.writeFileSync(outputPath, toYaml({
    title: { ja: '受賞', en: 'Awards' },
    awards
  }));
  console.log(`  Saved: ${outputPath} (${awards.length} items)`);
}

// Convert grants
function convertGrants() {
  const inputPath = path.join(TRANSLATED_DIR, 'grants-translated.json');
  if (!fs.existsSync(inputPath)) return;

  console.log('[Grants] Converting to YAML...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  const grants = data.items.map((item: any, idx: number) => ({
    id: `grant-${idx + 1}`,
    title: item.title_ja ? {
      ja: item.title_ja,
      en: item.title_en
    } : (item.title || ''),
    funder: item.funder_ja ? {
      ja: item.funder_ja,
      en: item.funder_en
    } : (item.funder || ''),
    pi: item.pi,
    role: item.role,
    startYear: item.startYear,
    endYear: item.endYear,
  })).filter((g: any) => g.title);

  const outputDir = path.join(CONTENT_DIR, 'grants');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'grants.yaml');
  fs.writeFileSync(outputPath, toYaml({
    title: { ja: '研究費', en: 'Research Grants' },
    grants
  }));
  console.log(`  Saved: ${outputPath} (${grants.length} items)`);
}

// Convert media
function convertMedia() {
  const inputPath = path.join(TRANSLATED_DIR, 'media-translated.json');
  if (!fs.existsSync(inputPath)) return;

  console.log('[Media] Converting to YAML...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  const media = data.items.map((item: any, idx: number) => ({
    id: `media-${idx + 1}`,
    title: item.title_ja ? {
      ja: item.title_ja,
      en: item.title_en
    } : (item.title || ''),
    source: item.source_ja ? {
      ja: item.source_ja,
      en: item.source_en
    } : (item.source || ''),
    type: item.type,
    year: item.year,
    month: item.month,
    day: item.day,
  })).filter((m: any) => m.title || m.source);

  const outputDir = path.join(CONTENT_DIR, 'media');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'appearances.yaml');
  fs.writeFileSync(outputPath, toYaml({
    title: { ja: 'メディア掲載', en: 'Media Appearances' },
    appearances: media
  }));
  console.log(`  Saved: ${outputPath} (${media.length} items)`);
}

// Convert theses
function convertTheses() {
  const inputPath = path.join(TRANSLATED_DIR, 'theses-translated.json');
  if (!fs.existsSync(inputPath)) return;

  console.log('[Theses] Converting to YAML...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  // Group by degree type
  const phd: any[] = [];
  const master: any[] = [];
  const bachelor: any[] = [];

  data.items.forEach((item: any, idx: number) => {
    const thesis = {
      id: `thesis-${idx + 1}`,
      name: item.name,
      title: item.title_ja ? {
        ja: item.title_ja,
        en: item.title_en
      } : (item.title || ''),
      year: item.year,
    };

    if (item.degree === 'phd') phd.push(thesis);
    else if (item.degree === 'master') master.push(thesis);
    else bachelor.push(thesis);
  });

  const outputDir = path.join(CONTENT_DIR, 'theses');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'theses.yaml');
  fs.writeFileSync(outputPath, toYaml({
    title: { ja: '学位論文', en: 'Theses' },
    categories: [
      { id: 'phd', title: { ja: '博士論文', en: 'Doctoral Dissertations' }, theses: phd },
      { id: 'master', title: { ja: '修士論文', en: 'Master\'s Theses' }, theses: master },
      { id: 'bachelor', title: { ja: '卒業論文', en: 'Bachelor\'s Theses' }, theses: bachelor },
    ]
  }));
  console.log(`  Saved: ${outputPath} (PhD: ${phd.length}, Master: ${master.length}, Bachelor: ${bachelor.length})`);
}

// Convert posters
function convertPosters() {
  const inputPath = path.join(TRANSLATED_DIR, 'posters-translated.json');
  if (!fs.existsSync(inputPath)) return;

  console.log('[Posters] Converting to YAML...');
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  const posters = data.items.map((item: any, idx: number) => ({
    id: `poster-${idx + 1}`,
    title: item.title_ja ? {
      ja: item.title_ja,
      en: item.title_en
    } : (item.title || ''),
    authors: item.authors || [],
    year: item.year,
  })).filter((p: any) => p.title);

  const outputDir = path.join(CONTENT_DIR, 'presentations');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, 'posters.yaml');
  fs.writeFileSync(outputPath, toYaml({
    title: { ja: 'ポスター発表', en: 'Poster Presentations' },
    posters
  }));
  console.log(`  Saved: ${outputPath} (${posters.length} items)`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('JSON to Bilingual YAML Converter');
  console.log('='.repeat(60));

  convertAwards();
  convertGrants();
  convertMedia();
  convertTheses();
  convertPosters();

  console.log('\n' + '='.repeat(60));
  console.log('Conversion complete!');
}

main().catch(console.error);
