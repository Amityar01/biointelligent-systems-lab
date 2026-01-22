/**
 * Add missing content from original site:
 * - Awards
 * - Media coverage
 * - Any missing posters
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSED_DIR = path.join(__dirname, '..', 'scraped', 'parsed');
const PUBLICATIONS_DIR = path.join(__dirname, '..', 'content', 'publications');

function normalize(title: string): string {
  // Extract title from brackets if present
  const match = (title || '').match(/[「「]([^」」]+)[」」]/);
  const t = match ? match[1] : (title || '').split(/[,，]/)[0];

  return t
    .toLowerCase()
    .replace(/[\s「」""''（）()【】\[\]]/g, '')
    .replace(/[0-9]/g, '')
    .slice(0, 25);
}

function getExistingTitles(): Set<string> {
  const titles = new Set<string>();
  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));

  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(PUBLICATIONS_DIR, f), 'utf-8');
      const pub = yaml.parse(content);
      titles.add(normalize(pub.title || ''));
    } catch (e) {
      // Skip invalid files
    }
  }

  return titles;
}

function createSlug(title: string, type: string, index: number): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^\w\u3040-\u9fff]+/g, '-')
    .slice(0, 30)
    .replace(/-+$/, '');

  return `${type}-${titleSlug}-${index}`;
}

async function addAwards() {
  console.log('\n=== Adding Awards ===\n');

  const awardsPath = path.join(PARSED_DIR, 'awards-all.json');
  if (!fs.existsSync(awardsPath)) {
    console.log('awards-all.json not found');
    return 0;
  }

  const data = JSON.parse(fs.readFileSync(awardsPath, 'utf-8'));
  const awards = data.items || [];
  const existing = getExistingTitles();

  let added = 0;

  for (let i = 0; i < awards.length; i++) {
    const award = awards[i];
    const title = award.awardName || award.title?.ja || award.title?.en || '';

    if (!title || title.length < 5) continue;

    const norm = normalize(title);
    if (existing.has(norm)) continue;

    const pub = {
      id: `award-${i + 1}`,
      title: title,
      authors: award.recipients || [],
      year: award.year,
      type: 'award',
      tags: ['japanese'],
    };

    const filename = createSlug(title, 'award', i + 1) + '.yaml';
    fs.writeFileSync(
      path.join(PUBLICATIONS_DIR, filename),
      yaml.stringify(pub)
    );

    console.log(`Added: ${filename}`);
    existing.add(norm);
    added++;
  }

  return added;
}

async function addMedia() {
  console.log('\n=== Adding Media Coverage ===\n');

  const mediaPath = path.join(PARSED_DIR, 'medias-all.json');
  if (!fs.existsSync(mediaPath)) {
    console.log('medias-all.json not found');
    return 0;
  }

  const data = JSON.parse(fs.readFileSync(mediaPath, 'utf-8'));
  const items = data.items || [];
  const existing = getExistingTitles();

  let added = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.title?.ja || item.title?.en || item.title || '';

    if (!title || title.length < 3) continue;

    const norm = normalize(title);
    if (existing.has(norm)) continue;

    const pub = {
      id: `media-${i + 1}`,
      title: title,
      authors: item.authors || ['高橋宏知'],
      year: item.year,
      type: 'media',
      source: item.source || item.journal,
      tags: item.title?.ja ? ['japanese'] : ['english'],
    };

    const filename = createSlug(title, 'media', i + 1) + '.yaml';
    fs.writeFileSync(
      path.join(PUBLICATIONS_DIR, filename),
      yaml.stringify(pub)
    );

    console.log(`Added: ${title.slice(0, 40)}...`);
    existing.add(norm);
    added++;
  }

  return added;
}

async function addMissingPosters() {
  console.log('\n=== Adding Missing Posters ===\n');

  const postersPath = path.join(PARSED_DIR, 'posters-all.json');
  if (!fs.existsSync(postersPath)) {
    console.log('posters-all.json not found');
    return 0;
  }

  const data = JSON.parse(fs.readFileSync(postersPath, 'utf-8'));
  const items = data.items || [];
  const existing = getExistingTitles();

  let added = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.title?.ja || item.title?.en || item.title || '';

    if (!title || title.length < 5) continue;

    const norm = normalize(title);
    if (existing.has(norm)) continue;

    const pub = {
      id: `poster-${i + 1}`,
      title: title,
      authors: item.authors || [],
      year: item.year,
      type: 'poster',
      conference: item.conference || item.journal,
      tags: item.title?.ja ? ['japanese'] : ['english'],
    };

    const filename = createSlug(title, 'poster', i + 1) + '.yaml';
    fs.writeFileSync(
      path.join(PUBLICATIONS_DIR, filename),
      yaml.stringify(pub)
    );

    console.log(`Added: ${title.slice(0, 40)}...`);
    existing.add(norm);
    added++;
  }

  return added;
}

async function main() {
  console.log('============================================================');
  console.log('ADD MISSING CONTENT FROM ORIGINAL SITE');
  console.log('============================================================');

  const awardCount = await addAwards();
  const mediaCount = await addMedia();
  const posterCount = await addMissingPosters();

  console.log('\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`Awards added:  ${awardCount}`);
  console.log(`Media added:   ${mediaCount}`);
  console.log(`Posters added: ${posterCount}`);
  console.log(`Total added:   ${awardCount + mediaCount + posterCount}`);

  const totalFiles = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml')).length;
  console.log(`\nTotal publication files: ${totalFiles}`);
}

main().catch(console.error);
