/**
 * Smart deduplication of publications
 * - Groups by title
 * - Merges best data from all versions
 * - Keeps most complete version
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLICATIONS_DIR = path.join(__dirname, '..', 'content', 'publications');

interface Publication {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  type?: string;
  journal?: string;
  conference?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  awards?: string[];
  tags?: string[];
  [key: string]: any;
}

interface FileData {
  filename: string;
  pub: Publication;
}

// Normalize title for comparison
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[「」""'']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Score a publication by completeness
function scorePublication(pub: Publication): number {
  let score = 0;

  // Authors count
  score += (pub.authors?.length || 0) * 10;

  // Has awards
  if (pub.awards && pub.awards.length > 0) score += 50;

  // Has DOI
  if (pub.doi) score += 30;

  // Has conference (better than journal for presentations)
  if (pub.conference) score += 20;
  if (pub.journal) score += 15;

  // Has pages
  if (pub.pages) score += 10;

  // Type is not 'award' (award type is usually wrong for presentations)
  if (pub.type && pub.type !== 'award') score += 10;

  // Has year
  if (pub.year) score += 5;

  return score;
}

// Merge best fields from multiple publications
function mergeBest(publications: FileData[]): Publication {
  // Sort by score, highest first
  const sorted = [...publications].sort((a, b) =>
    scorePublication(b.pub) - scorePublication(a.pub)
  );

  const best = { ...sorted[0].pub };

  // Collect all unique authors (preserving order from best version)
  const allAuthors = new Set<string>();
  for (const fd of sorted) {
    for (const author of fd.pub.authors || []) {
      allAuthors.add(author);
    }
  }
  // Start with best version's authors, then add any missing
  const mergedAuthors = [...(best.authors || [])];
  for (const author of allAuthors) {
    if (!mergedAuthors.some(a => a === author || a.includes(author) || author.includes(a))) {
      mergedAuthors.push(author);
    }
  }
  best.authors = mergedAuthors;

  // Collect all awards
  const allAwards = new Set<string>();
  for (const fd of sorted) {
    for (const award of fd.pub.awards || []) {
      allAwards.add(award);
    }
  }
  if (allAwards.size > 0) {
    best.awards = [...allAwards];
  }

  // Take DOI if any version has it
  if (!best.doi) {
    for (const fd of sorted) {
      if (fd.pub.doi) {
        best.doi = fd.pub.doi;
        break;
      }
    }
  }

  // Take pages if any version has it
  if (!best.pages) {
    for (const fd of sorted) {
      if (fd.pub.pages) {
        best.pages = fd.pub.pages;
        break;
      }
    }
  }

  // Fix type if it's 'award' but should be something else
  if (best.type === 'award' && (best.conference || best.journal)) {
    best.type = best.conference ? 'presentation' : 'journal';
  }

  return best;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('============================================================');
  console.log(`Smart Publication Deduplication ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('============================================================\n');

  // Read all publications
  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));
  console.log(`Total files: ${files.length}\n`);

  // Group by normalized title
  const byTitle = new Map<string, FileData[]>();

  for (const file of files) {
    const filepath = path.join(PUBLICATIONS_DIR, file);
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const pub = yaml.parse(content) as Publication;

      if (!pub.title) continue;

      const normTitle = normalizeTitle(pub.title);

      if (!byTitle.has(normTitle)) {
        byTitle.set(normTitle, []);
      }
      byTitle.get(normTitle)!.push({ filename: file, pub });
    } catch (e) {
      console.error(`Error reading ${file}: ${e}`);
    }
  }

  // Find duplicates
  const duplicates: Array<{ title: string; files: FileData[] }> = [];
  for (const [title, fileList] of byTitle) {
    if (fileList.length > 1) {
      duplicates.push({ title, files: fileList });
    }
  }

  console.log(`Found ${duplicates.length} titles with duplicates\n`);

  // Process duplicates
  let totalDeleted = 0;
  let totalKept = 0;

  for (const dup of duplicates) {
    const merged = mergeBest(dup.files);
    const sorted = [...dup.files].sort((a, b) =>
      scorePublication(b.pub) - scorePublication(a.pub)
    );

    const keepFile = sorted[0].filename;
    const deleteFiles = sorted.slice(1).map(f => f.filename);

    console.log(`\nTitle: ${dup.title.slice(0, 60)}...`);
    console.log(`  Keep: ${keepFile} (score: ${scorePublication(sorted[0].pub)})`);
    console.log(`  Delete: ${deleteFiles.length} files`);

    // Check if merge adds anything to the kept file
    const originalScore = scorePublication(sorted[0].pub);
    const mergedScore = scorePublication(merged);

    if (mergedScore > originalScore) {
      console.log(`  Merged: score ${originalScore} -> ${mergedScore}`);
      if (merged.authors.length > sorted[0].pub.authors.length) {
        console.log(`    + Added authors: ${merged.authors.filter(a => !sorted[0].pub.authors.includes(a)).join(', ')}`);
      }
      if (merged.awards && (!sorted[0].pub.awards || merged.awards.length > sorted[0].pub.awards.length)) {
        console.log(`    + Added awards`);
      }
    }

    if (!dryRun) {
      // Write merged version
      const keepPath = path.join(PUBLICATIONS_DIR, keepFile);
      fs.writeFileSync(keepPath, yaml.stringify(merged));

      // Delete duplicates
      for (const delFile of deleteFiles) {
        fs.unlinkSync(path.join(PUBLICATIONS_DIR, delFile));
        totalDeleted++;
      }
      totalKept++;
    } else {
      totalDeleted += deleteFiles.length;
      totalKept++;
    }
  }

  console.log('\n============================================================');
  console.log('DEDUPLICATION COMPLETE');
  console.log('============================================================');
  console.log(`Duplicate groups: ${duplicates.length}`);
  console.log(`Files kept (merged): ${totalKept}`);
  console.log(`Files deleted: ${totalDeleted}`);
  console.log(`Final file count: ${files.length - totalDeleted}`);
}

main().catch(console.error);
