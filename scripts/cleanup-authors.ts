/**
 * Cleanup author names in publication YAML files
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
  [key: string]: any;
}

// Typo fixes - exact replacements
const TYPO_FIXES: Record<string, string> = {
  // English typos
  'Hirokzau Takahashi': 'Hirokazu Takahashi',
  'Hirokazu Takahashia': 'Hirokazu Takahashi',
  'Hirokazu Takahshi': 'Hirokazu Takahashi',
  'A. Hierlemman': 'A. Hierlemann',
  'Andreas Hierlemman': 'Andreas Hierlemann',
  'Douglas Ballum': 'Douglas Bakkum',
  // Japanese space normalization
  '高橋　宏知': '高橋宏知',
  '高橋 宏知': '高橋宏知',
  '神崎 亮平': '神崎亮平',
  '李 婷玉': '李婷玉',
  '森 叶人': '森叶人',
  // Role annotations
  '畑村洋太郎 (編著)': '畑村洋太郎',
};

// Role annotations to remove (regex patterns)
const ROLE_PATTERNS = [
  /\s*\(代表者\)$/,
  /\s*（代表者）$/,
  /\s*\(分担者\)$/,
  /\s*（分担者）$/,
  /\s*\(研究分担者\)$/,
  /\s*\(分担研究者\)$/,
  /\s*\(課題推進者\)$/,
  /\s*（課題推進者）$/,
  /\s*\(実際の設計研究会\)$/,
  /\s*\(編著\)$/,
  /\s*（編著）$/,
];

// Patterns that indicate this is NOT an author - should be removed
const NOT_AUTHOR_PATTERNS = [
  /^News\d+/i,
  /^「/,                          // Japanese quote start
  /^$/,                           // Empty string
  /^>-$/,                         // YAML artifact
  /^>$/,                          // YAML artifact
  /受賞$/,                        // Award suffix (Japanese)
  /^Keynote/i,                    // Keynote speaker tag
  /^Brain keynote/i,
  /^Invited/i,                    // Invited speaker tag
  /^BBC /,                        // Media
  /^週刊/,                        // Weekly magazine
  /^本よみうり/,                  // Book review
  /^東大　/,                      // University news prefix
  /^東大他$/,                     // "UTokyo etc"
  /^東大最前線/,                  // UTokyo frontline news
  /^東京大学医学部/,              // Hospital name
  /^計算機に/,                    // Title fragment
  /^Kein Tempolimit/,             // German title fragment
  /^GGeshwind/,                   // Garbage text
  /^Mozart, just like/,           // Leftover from bad split
  /^Haste$/,                      // Leftover from bad split
  /^waste on neuronal/,           // Leftover from bad split
  /^RIKEN$/,                      // Organization only
  /^Neuroscience Research Collaboration/, // Title fragment
  /^Excellence in /,              // Award description
  /^IEEE /,                       // IEEE anything (awards, competitions)
  /^The \d+(st|nd|rd|th) Prize/,  // Prize descriptions
  /Competition/i,                 // Competition entries
  /Award$/,                       // Award suffix (English)
  /Award\)/,                      // Award in parentheses
  /^Young Investigator/i,         // Young investigator awards
  /^平成\d+年/,                   // Japanese year prefix (award entries)
  /優秀論文/,                     // Excellent paper award
  /奨励賞/,                       // Encouragement award
  /^Brain keynote/i,              // Brain keynote lecture
  /keynote lecture/i,             // Any keynote lecture
  /special invited/i,             // Special invited speaker
];

// Check if string looks like a valid author name
function isValidAuthor(name: string): boolean {
  // Too short
  if (name.length < 2) return false;

  // Check against invalid patterns
  for (const pattern of NOT_AUTHOR_PATTERNS) {
    if (pattern.test(name)) return false;
  }

  // Must contain at least one letter (Japanese or English)
  if (!/[a-zA-Z\u3040-\u9fff]/.test(name)) return false;

  return true;
}

function cleanAuthorName(name: string): string[] {
  // Check if this is not an author
  if (!isValidAuthor(name)) {
    return []; // Remove this entry
  }

  // Apply typo fixes
  let cleaned = name;
  for (const [typo, fix] of Object.entries(TYPO_FIXES)) {
    if (cleaned === typo) {
      cleaned = fix;
    }
  }

  // Remove role annotations
  for (const pattern of ROLE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Split on " and " to separate combined authors
  // But be careful with initials like "H. Takahashi"
  if (/ and /.test(cleaned) && cleaned.split(' and ').every(p => p.trim().length > 3)) {
    const parts = cleaned.split(/ and /);
    return parts.map(p => p.trim()).filter(p => isValidAuthor(p));
  }

  cleaned = cleaned.trim();
  return isValidAuthor(cleaned) ? [cleaned] : [];
}

function processFile(filepath: string): { modified: boolean; changes: string[] } {
  const content = fs.readFileSync(filepath, 'utf-8');
  const changes: string[] = [];

  try {
    const pub = yaml.parse(content) as Publication;

    if (!pub.authors || !Array.isArray(pub.authors)) {
      return { modified: false, changes: [] };
    }

    const newAuthors: string[] = [];
    let modified = false;

    for (const author of pub.authors) {
      if (typeof author !== 'string') {
        changes.push(`  REMOVED (non-string): ${JSON.stringify(author)}`);
        modified = true;
        continue;
      }

      const cleaned = cleanAuthorName(author);

      if (cleaned.length === 0) {
        changes.push(`  REMOVED: "${author}"`);
        modified = true;
      } else if (cleaned.length === 1 && cleaned[0] === author) {
        // No change
        newAuthors.push(author);
      } else if (cleaned.length === 1) {
        // Single author, but cleaned
        changes.push(`  FIXED: "${author}" → "${cleaned[0]}"`);
        newAuthors.push(cleaned[0]);
        modified = true;
      } else {
        // Split into multiple authors
        changes.push(`  SPLIT: "${author}" → [${cleaned.map(c => `"${c}"`).join(', ')}]`);
        newAuthors.push(...cleaned);
        modified = true;
      }
    }

    if (modified) {
      pub.authors = newAuthors;
      const newContent = yaml.stringify(pub);
      fs.writeFileSync(filepath, newContent);
    }

    return { modified, changes };
  } catch (e) {
    console.error(`Error processing ${filepath}: ${e}`);
    return { modified: false, changes: [] };
  }
}

async function main() {
  console.log('============================================================');
  console.log('Author Name Cleanup (Comprehensive)');
  console.log('============================================================\n');

  const files = fs.readdirSync(PUBLICATIONS_DIR)
    .filter(f => f.endsWith('.yaml'))
    .sort();

  console.log(`Processing ${files.length} files...\n`);

  let totalModified = 0;
  let totalTypoFixes = 0;
  let totalSplits = 0;
  let totalRemoved = 0;

  for (const file of files) {
    const filepath = path.join(PUBLICATIONS_DIR, file);
    const { modified, changes } = processFile(filepath);

    if (modified) {
      console.log(`${file}:`);
      for (const change of changes) {
        console.log(change);
        if (change.includes('FIXED:')) totalTypoFixes++;
        if (change.includes('SPLIT:')) totalSplits++;
        if (change.includes('REMOVED')) totalRemoved++;
      }
      console.log('');
      totalModified++;
    }
  }

  console.log('============================================================');
  console.log('CLEANUP COMPLETE');
  console.log('============================================================');
  console.log(`Files modified: ${totalModified}`);
  console.log(`Typos fixed: ${totalTypoFixes}`);
  console.log(`Authors split: ${totalSplits}`);
  console.log(`Invalid entries removed: ${totalRemoved}`);
}

main().catch(console.error);
