/**
 * Find DOIs for papers by searching their titles
 * Uses CrossRef API to search by title
 *
 * Usage: npx tsx scripts/find-dois-by-title.ts [--dry-run] [--limit=10]
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const CROSSREF_API = 'https://api.crossref.org/works';
const DELAY_MS = 1000; // Rate limit

interface Paper {
  id: string;
  title: string;
  authors?: string[];
  year?: number;
  doi?: string;
  type?: string;
  conference?: string;
  journal?: string;
  tags?: string[];
  [key: string]: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadPapersWithoutDoi(): { path: string; data: Paper }[] {
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const results: { path: string; data: Paper }[] = [];

  const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml'));

  for (const file of files) {
    const filePath = path.join(pubsDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.load(content, { schema: yaml.JSON_SCHEMA }) as Paper;

      // Skip if already has DOI or no title
      if (data.doi || !data.title) continue;

      // Skip Japanese-only titles (hard to search in CrossRef)
      const hasLatin = /[a-zA-Z]{3,}/.test(data.title);
      if (!hasLatin) continue;

      // Prefer journal/conference papers (more likely to have DOIs)
      if (data.type === 'journal' || data.type === 'conference') {
        results.push({ path: filePath, data });
      }
    } catch {}
  }

  return results;
}

async function searchDoi(title: string, year?: number, authors?: string[]): Promise<{ doi: string; score: number; title: string } | null> {
  try {
    // Clean title for search
    const cleanTitle = title
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);

    const params = new URLSearchParams({
      'query.title': cleanTitle,
      'rows': '3',
      'select': 'DOI,title,score,author,published',
    });

    const url = `${CROSSREF_API}?${params}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LabWebsite/1.0 (mailto:takahashi@i.u-tokyo.ac.jp)',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const items = data.message?.items || [];

    if (items.length === 0) return null;

    // Find best match
    for (const item of items) {
      const itemTitle = Array.isArray(item.title) ? item.title[0] : item.title;
      if (!itemTitle) continue;

      // Check title similarity (simple word overlap)
      const titleWords = new Set(cleanTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const itemWords = new Set(itemTitle.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));

      let overlap = 0;
      for (const word of titleWords) {
        if (itemWords.has(word)) overlap++;
      }

      const similarity = titleWords.size > 0 ? overlap / titleWords.size : 0;

      // Check year if available
      const itemYear = item.published?.['date-parts']?.[0]?.[0];
      const yearMatch = !year || !itemYear || Math.abs(year - itemYear) <= 1;

      // Require high title similarity and year match
      if (similarity >= 0.75 && yearMatch) {
        return {
          doi: item.DOI,
          score: similarity,
          title: itemTitle,
        };
      }
    }

    return null;
  } catch (err) {
    console.error(`  Search error: ${err}`);
    return null;
  }
}

function savePaper(filePath: string, data: Paper): void {
  const content = yaml.dump(data, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
  });
  fs.writeFileSync(filePath, content);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 20;

  console.log(`=== Find DOIs by Title Search ===\n`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Limit: ${limit}\n`);

  const papers = loadPapersWithoutDoi();
  console.log(`Found ${papers.length} papers without DOI (journal/conference with English titles)\n`);

  // Sort by year descending (recent papers more likely to be in CrossRef)
  papers.sort((a, b) => (b.data.year || 0) - (a.data.year || 0));

  const toProcess = papers.slice(0, limit);
  let found = 0;
  let notFound = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const { path: filePath, data } = toProcess[i];
    const shortTitle = data.title.slice(0, 50);

    console.log(`[${i + 1}/${toProcess.length}] ${shortTitle}...`);
    console.log(`  Year: ${data.year || '?'}, Type: ${data.type}`);

    const result = await searchDoi(data.title, data.year, data.authors);

    if (result) {
      console.log(`  ✓ Found: ${result.doi}`);
      console.log(`    Match: "${result.title.slice(0, 60)}..." (${(result.score * 100).toFixed(0)}%)`);

      if (!dryRun) {
        data.doi = result.doi;
        savePaper(filePath, data);
        console.log(`    Saved!`);
      }
      found++;
    } else {
      console.log(`  ✗ Not found`);
      notFound++;
    }

    if (i < toProcess.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Found: ${found}`);
  console.log(`Not found: ${notFound}`);

  if (dryRun && found > 0) {
    console.log(`\nRun without --dry-run to save DOIs`);
  }

  if (found > 0 && !dryRun) {
    console.log(`\nNext: run 'npm run fetch-abstracts' to get abstracts for new DOIs`);
  }
}

main().catch(console.error);
