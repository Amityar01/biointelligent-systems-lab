/**
 * Verify a single category from the old site against our YAML files
 * Usage: npx tsx scripts/verify-category.ts <category-name>
 *
 * Categories: jp-papers, en-papers, jp-reviews, en-reviews, jp-books, en-books,
 *             conference, presentations, awards, grants, theses
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLICATIONS_DIR = path.join(__dirname, '..', 'content', 'publications');
const OLD_SITE_CACHE = path.join(__dirname, '..', 'scraped', 'old-site-pub.html');

// Category definitions - maps to sections on the old site
const CATEGORIES: Record<string, {
  sectionHeader: string;
  yamlType: string;
  yamlTags?: string[];
}> = {
  'jp-papers': {
    sectionHeader: '原著論文（和文）',
    yamlType: 'journal',
    yamlTags: ['japanese'],
  },
  'en-papers': {
    sectionHeader: '原著論文（英文）',
    yamlType: 'journal',
    yamlTags: ['english'],
  },
  'jp-reviews': {
    sectionHeader: '総説（和文）',
    yamlType: 'review',
    yamlTags: ['japanese'],
  },
  'en-reviews': {
    sectionHeader: '総説（英文）',
    yamlType: 'review',
    yamlTags: ['english'],
  },
  'jp-books': {
    sectionHeader: '著書（和文）',
    yamlType: 'book',
    yamlTags: ['japanese'],
  },
  'en-books': {
    sectionHeader: '著書（英文）',
    yamlType: 'book',
    yamlTags: ['english'],
  },
  'conference': {
    sectionHeader: '査読付き会議論文',
    yamlType: 'conference',
  },
  'presentations': {
    sectionHeader: '学会発表等',
    yamlType: 'presentation',
  },
  'awards': {
    sectionHeader: '受賞',
    yamlType: 'award',
  },
  'grants': {
    sectionHeader: '外部資金',
    yamlType: 'grant',
  },
  'theses': {
    sectionHeader: '学位論文',
    yamlType: 'thesis',
  },
};

interface OldSiteEntry {
  number: number;
  raw: string;
  title?: string;
  hasAward?: boolean;
  awardText?: string;
}

interface VerificationResult {
  category: string;
  oldSiteCount: number;
  yamlCount: number;
  matched: number;
  missing: string[];
  extra: string[];
}

function extractEntriesFromSection(html: string, sectionHeader: string): OldSiteEntry[] {
  const entries: OldSiteEntry[] = [];

  // Find the section
  const sectionRegex = new RegExp(
    `<h3[^>]*>.*?${sectionHeader}.*?</h3>([\\s\\S]*?)(?=<h3|<h2|$)`,
    'i'
  );

  const sectionMatch = html.match(sectionRegex);
  if (!sectionMatch) {
    console.log(`Section not found: ${sectionHeader}`);
    return entries;
  }

  const sectionContent = sectionMatch[1];

  // Extract numbered entries: (1), (2), etc.
  const entryRegex = /\((\d+)\)\s*([^(]+?)(?=\(\d+\)|$)/g;
  let match;

  while ((match = entryRegex.exec(sectionContent)) !== null) {
    const number = parseInt(match[1]);
    const raw = match[2].trim();

    // Check for award markers
    const hasAward = /受賞|Award|Prize|賞/.test(raw);

    // Extract title (usually in 「」 or quotes)
    const titleMatch = raw.match(/[「「]([^」」]+)[」」]/) ||
                       raw.match(/"([^"]+)"/) ||
                       raw.match(/「([^」]+)」/);

    entries.push({
      number,
      raw: raw.slice(0, 200), // Truncate for comparison
      title: titleMatch ? titleMatch[1] : undefined,
      hasAward,
    });
  }

  return entries;
}

function getYamlEntries(type: string, tags?: string[]): Map<string, any> {
  const entries = new Map();
  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));

  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(PUBLICATIONS_DIR, f), 'utf-8');
      const pub = yaml.parse(content);

      if (pub.type !== type) continue;

      // Check tags if specified
      if (tags && tags.length > 0) {
        const pubTags = pub.tags || [];
        const hasMatchingTag = tags.some(t => pubTags.includes(t));
        if (!hasMatchingTag) continue;
      }

      const key = (pub.title || '').toLowerCase().slice(0, 30);
      entries.set(key, { ...pub, _file: f });
    } catch (e) {
      // Skip invalid files
    }
  }

  return entries;
}

function normalizeForComparison(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[\s「」""''（）()\[\]【】]/g, '')
    .slice(0, 30);
}

async function verifyCategory(categoryName: string): Promise<VerificationResult> {
  const category = CATEGORIES[categoryName];
  if (!category) {
    throw new Error(`Unknown category: ${categoryName}. Valid: ${Object.keys(CATEGORIES).join(', ')}`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`VERIFYING: ${categoryName} (${category.sectionHeader})`);
  console.log(`${'='.repeat(60)}\n`);

  // Check if we have cached HTML
  if (!fs.existsSync(OLD_SITE_CACHE)) {
    console.log('Old site HTML not cached. Fetching...');
    // Would fetch here, but for now require manual download
    console.log(`Please save https://www.ne.t.u-tokyo.ac.jp/~takahashi/pub.html to:`);
    console.log(OLD_SITE_CACHE);
    process.exit(1);
  }

  const html = fs.readFileSync(OLD_SITE_CACHE, 'utf-8');

  // Extract entries from old site
  const oldEntries = extractEntriesFromSection(html, category.sectionHeader);
  console.log(`Old site entries: ${oldEntries.length}`);

  // Get YAML entries
  const yamlEntries = getYamlEntries(category.yamlType, category.yamlTags);
  console.log(`YAML entries: ${yamlEntries.size}`);

  // Compare
  const missing: string[] = [];
  const matched: string[] = [];

  for (const entry of oldEntries) {
    const normalized = normalizeForComparison(entry.title || entry.raw);

    let found = false;
    for (const [key, pub] of yamlEntries) {
      if (normalizeForComparison(pub.title).includes(normalized.slice(0, 20)) ||
          normalized.includes(normalizeForComparison(pub.title).slice(0, 20))) {
        found = true;
        matched.push(`(${entry.number}) ${entry.title || entry.raw.slice(0, 40)}`);
        yamlEntries.delete(key); // Remove so we can find extras
        break;
      }
    }

    if (!found) {
      missing.push(`(${entry.number}) ${entry.title || entry.raw.slice(0, 50)}`);
    }
  }

  // Remaining YAML entries are "extra" (in new site but not old)
  const extra = Array.from(yamlEntries.values()).map(p => p.title?.slice(0, 50) || p._file);

  // Report
  console.log(`\nMatched: ${matched.length}`);
  console.log(`Missing from new site: ${missing.length}`);
  console.log(`Extra in new site: ${extra.length}`);

  if (missing.length > 0) {
    console.log(`\nMISSING (first 10):`);
    missing.slice(0, 10).forEach(m => console.log(`  - ${m}`));
  }

  if (extra.length > 0) {
    console.log(`\nEXTRA (first 10):`);
    extra.slice(0, 10).forEach(e => console.log(`  + ${e}`));
  }

  return {
    category: categoryName,
    oldSiteCount: oldEntries.length,
    yamlCount: yamlEntries.size + matched.length,
    matched: matched.length,
    missing,
    extra,
  };
}

async function main() {
  const categoryName = process.argv[2];

  if (!categoryName) {
    console.log('Usage: npx tsx scripts/verify-category.ts <category>');
    console.log(`\nCategories: ${Object.keys(CATEGORIES).join(', ')}`);
    console.log('\nOr use "all" to verify all categories');
    process.exit(1);
  }

  if (categoryName === 'all') {
    const results: VerificationResult[] = [];
    for (const cat of Object.keys(CATEGORIES)) {
      try {
        results.push(await verifyCategory(cat));
      } catch (e) {
        console.error(`Error verifying ${cat}:`, e);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log(`${'='.repeat(60)}`);
    for (const r of results) {
      const status = r.missing.length === 0 ? '✓' : '✗';
      console.log(`${status} ${r.category}: ${r.oldSiteCount} old, ${r.matched} matched, ${r.missing.length} missing`);
    }
  } else {
    await verifyCategory(categoryName);
  }
}

main().catch(console.error);
