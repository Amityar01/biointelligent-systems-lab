/**
 * Add missing media items to publications
 *
 * Adds the "Rats bop to the beat" coverage and other missing media items
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLICATIONS_DIR = path.join(__dirname, '..', 'content', 'publications');
const PARSED_DIR = path.join(__dirname, '..', 'scraped', 'parsed');

interface MediaItem {
  id: string;
  title?: string;
  source?: string;
  date?: string;
  url?: string;
  _raw: string;
}

function parseMediaFromRaw(raw: string): Partial<MediaItem> {
  const result: Partial<MediaItem> = { _raw: raw };

  // Extract title from quotes
  const titleMatch = raw.match(/[\u201c"]([^\u201d"]+)[\u201d"]/) ||
                     raw.match(/「([^」]+)」/);
  if (titleMatch) {
    result.title = titleMatch[1];
  }

  // Extract source (after title, before date)
  const sourcePatterns = [
    /[\u201d"」]\s*([A-Za-z\s]+(?:News|Times|Guardian|Journal|Post|Scientific|Science|Scientist)?)/i,
    /EurekAlert/i,
    /ハフポスト|日経|NHK|BBC|CNN/,
  ];

  for (const pattern of sourcePatterns) {
    const match = raw.match(pattern);
    if (match) {
      result.source = match[1]?.trim() || match[0];
      break;
    }
  }

  // Extract date
  const dateMatch = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})?日?/);
  if (dateMatch) {
    result.date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}${dateMatch[3] ? '-' + dateMatch[3].padStart(2, '0') : ''}`;
  }

  // Extract URL
  const urlMatch = raw.match(/https?:\/\/[^\s)]+/);
  if (urlMatch) {
    result.url = urlMatch[0];
  }

  return result;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\s「」""''（）()\[\]【】]/g, '')
    .slice(0, 25);
}

function titleExists(title: string, existingTitles: Set<string>): boolean {
  const normalized = normalizeTitle(title);
  if (normalized.length < 5) return false;

  for (const existing of existingTitles) {
    if (existing.includes(normalized.slice(0, 15)) || normalized.includes(existing.slice(0, 15))) {
      return true;
    }
  }
  return false;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('============================================================');
  console.log(`ADD MISSING MEDIA ITEMS ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('============================================================\n');

  // Load existing YAML titles
  const existingTitles = new Set<string>();
  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));

  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(PUBLICATIONS_DIR, f), 'utf-8');
      const pub = yaml.parse(content);
      if (pub.title) {
        existingTitles.add(normalizeTitle(pub.title));
      }
    } catch (e) {
      // Skip invalid files
    }
  }

  console.log(`Existing YAML files: ${files.length}`);
  console.log(`Indexed titles: ${existingTitles.size}\n`);

  // Load media items
  const mediaData = JSON.parse(fs.readFileSync(path.join(PARSED_DIR, 'medias-all.json'), 'utf-8'));
  const mediaItems: { _raw: string }[] = mediaData.items;

  console.log(`Media items in JSON: ${mediaItems.length}\n`);

  // Find missing items
  let added = 0;
  let skipped = 0;

  for (const item of mediaItems) {
    const parsed = parseMediaFromRaw(item._raw);

    if (!parsed.title || parsed.title.length < 5) {
      continue;
    }

    if (titleExists(parsed.title, existingTitles)) {
      skipped++;
      continue;
    }

    // Generate file name
    const year = parsed.date?.slice(0, 4) || 'unknown';
    const titleSlug = parsed.title
      .slice(0, 30)
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const id = `media-${year}-${titleSlug}-${Date.now() % 10000}`;
    const fileName = `${year}-${titleSlug.slice(0, 30)}-media-${added + 1}.yaml`;

    const pubData: Record<string, any> = {
      id,
      title: parsed.title,
      type: 'media',
      year: parseInt(year) || undefined,
    };

    if (parsed.source) pubData.source = parsed.source;
    if (parsed.date) pubData.date = parsed.date;
    if (parsed.url) pubData.url = parsed.url;

    pubData.tags = ['media-coverage'];

    console.log(`ADDING: ${fileName}`);
    console.log(`  Title: ${parsed.title.slice(0, 50)}...`);
    console.log(`  Source: ${parsed.source || 'unknown'}`);

    if (!dryRun) {
      fs.writeFileSync(
        path.join(PUBLICATIONS_DIR, fileName),
        yaml.stringify(pubData)
      );
    }

    added++;
    existingTitles.add(normalizeTitle(parsed.title));
  }

  console.log('\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`Media items processed: ${mediaItems.length}`);
  console.log(`Already exist: ${skipped}`);
  console.log(`Added: ${added}`);
}

main().catch(console.error);
