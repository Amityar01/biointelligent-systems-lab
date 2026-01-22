import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PARSED_DIR = path.join(__dirname, '../scraped/parsed');
const OUTPUT_DIR = path.join(__dirname, '../content/publications');

interface ParsedItem {
  authors: string[];
  title: string;
  journal?: string;
  venue?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  year: number | null;
  doi?: string;
  type: string;
  raw: string;
  _batchIndex: number;
}

interface ParsedBatch {
  batchId: number;
  category: string;
  categoryTitle: string;
  items: ParsedItem[];
}

interface Publication {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  volume?: string;
  pages?: string;
  doi?: string;
  type: 'journal' | 'conference' | 'book' | 'review' | 'preprint';
  tags?: string[];
}

// Map batch categories to publication types
function mapCategoryToType(category: string, itemType?: string): Publication['type'] {
  // First check the item-level type
  if (itemType) {
    if (itemType === 'conference') return 'conference';
    if (itemType === 'book-chapter' || itemType === 'book') return 'book';
    if (itemType === 'review') return 'review';
    if (itemType === 'preprint') return 'preprint';
  }

  // Then check batch category
  if (category.includes('original')) return 'journal';
  if (category.includes('review')) return 'review';
  if (category.includes('conference')) return 'conference';
  if (category.includes('book')) return 'book';
  if (category.includes('presentation') || category.includes('oral')) return 'conference';

  return 'journal'; // default
}

// Generate a unique ID from year and title
function generateId(year: number | null, title: string, authors: string[], index: number): string {
  const y = year || 2000;

  // Get first author's last name (Japanese or English)
  let authorSlug = 'unknown';
  if (authors.length > 0) {
    const firstAuthor = authors[0];
    // For Japanese names, take first few characters
    if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(firstAuthor)) {
      authorSlug = firstAuthor.substring(0, 2);
    } else {
      // For English names, take last name
      const parts = firstAuthor.split(/[\s,]+/);
      authorSlug = parts[0].toLowerCase().replace(/[^a-z]/g, '');
    }
  }

  // Get a slug from title (first meaningful words)
  let titleSlug = title
    .toLowerCase()
    .replace(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '') // Remove Japanese
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join('-');

  if (!titleSlug) {
    titleSlug = `pub-${index}`;
  }

  return `${y}-${authorSlug}-${titleSlug}`.substring(0, 60);
}

// Add tags based on content
function generateTags(item: ParsedItem, category: string): string[] {
  const tags: string[] = [];
  const content = (item.title + ' ' + (item.journal || item.venue || '')).toLowerCase();

  // Language tag
  if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(item.title)) {
    tags.push('japanese');
  } else {
    tags.push('english');
  }

  // Topic tags
  if (content.includes('auditory') || content.includes('聴覚')) tags.push('auditory');
  if (content.includes('cortex') || content.includes('皮質')) tags.push('cortex');
  if (content.includes('electrode') || content.includes('電極')) tags.push('electrode');
  if (content.includes('neural') || content.includes('神経')) tags.push('neural');
  if (content.includes('bmi') || content.includes('brain-machine')) tags.push('bmi');
  if (content.includes('culture') || content.includes('培養')) tags.push('culture');
  if (content.includes('eeg') || content.includes('脳波')) tags.push('eeg');
  if (content.includes('mmn') || content.includes('mismatch')) tags.push('mmn');

  return tags;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Publication JSON → YAML Converter');
  console.log('='.repeat(60));

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Clear existing files
  const existing = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.yaml'));
  if (existing.length > 0) {
    console.log(`Removing ${existing.length} existing publication files...`);
    existing.forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
  }

  // Find all parsed batch files
  const batchFiles = fs.readdirSync(PARSED_DIR)
    .filter(f => f.match(/^batch-\d+-parsed\.json$/))
    .sort();

  console.log(`Found ${batchFiles.length} parsed batch files\n`);

  const usedIds = new Set<string>();
  let totalCreated = 0;
  let skipped = 0;

  for (const batchFile of batchFiles) {
    const batchPath = path.join(PARSED_DIR, batchFile);
    const batch: ParsedBatch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

    console.log(`Processing ${batchFile} (${batch.category}, ${batch.items.length} items)...`);

    for (let i = 0; i < batch.items.length; i++) {
      const item = batch.items[i];

      // Skip items without valid year
      if (!item.year || item.year < 1990 || item.year > 2030) {
        skipped++;
        continue;
      }

      // Generate unique ID
      let id = generateId(item.year, item.title, item.authors, totalCreated);
      let suffix = 1;
      const baseId = id;
      while (usedIds.has(id)) {
        id = `${baseId}-${suffix++}`;
      }
      usedIds.add(id);

      // Build publication object
      const pub: Publication = {
        id,
        title: item.title,
        authors: item.authors,
        journal: item.journal || item.venue || 'Unknown',
        year: item.year,
        type: mapCategoryToType(batch.category, item.type),
      };

      if (item.volume) pub.volume = item.volume;
      if (item.pages) pub.pages = item.pages;
      if (item.doi) pub.doi = item.doi;

      const tags = generateTags(item, batch.category);
      if (tags.length > 0) pub.tags = tags;

      // Convert to YAML
      const yamlContent = yaml.dump(pub, {
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false,
      });

      // Write file
      const filename = `${id}.yaml`;
      fs.writeFileSync(path.join(OUTPUT_DIR, filename), yamlContent, 'utf-8');
      totalCreated++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ Created ${totalCreated} publication YAML files`);
  console.log(`  Skipped ${skipped} items (invalid year)`);
  console.log(`  Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
