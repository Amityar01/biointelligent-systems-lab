/**
 * Fix award entries by re-extracting authors from raw data
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AWARDS_FILE = path.join(__dirname, '..', 'scraped', 'parsed', 'awards-all.json');
const PUBLICATIONS_DIR = path.join(__dirname, '..', 'content', 'publications');

interface AwardEntry {
  id: string;
  awardName: string;
  recipients: string[];
  year?: number;
  _raw: string;
  _valid: boolean;
}

// Clean name - remove award text artifacts
function cleanName(name: string): string {
  return name
    .replace(/^\([^)]+\)\s*/, '')      // Remove (Award text) prefix
    .replace(/^（[^）]+）\s*/, '')     // Remove （Award text） prefix
    .replace(/^[A-Z]\s+/, '')          // Remove "A " prefix
    .replace(/Award[^a-z]*$/i, '')     // Remove Award suffix
    .trim();
}

// Extract authors from raw Japanese award text
function extractAuthorsFromRaw(raw: string): string[] {
  const authors: string[] = [];

  // Pattern: After award name, authors are listed before 「 or ：「
  // e.g., "平成19年...優秀論文賞 船水章大，神崎亮平，高橋宏知：「Title..."

  // Try Japanese pattern first
  const jpPatterns = [
    /賞\s+([^\s：「][^：「]+)[：:]\s*[「"]/,
    /Award\)\s*([^：「]+)[：:]\s*[「"]/,
    /Award）\s*([^：「]+)[：:]\s*[「"]/,
  ];

  for (const pattern of jpPatterns) {
    const match = raw.match(pattern);
    if (match) {
      const namesPart = match[1].trim();
      // Split by Japanese or English comma
      const names = namesPart.split(/[，,、]/)
        .map(n => cleanName(n.trim()))
        .filter(n => {
          // Valid name: has Japanese chars or is proper English name, length 2+
          return n.length >= 2 &&
                 ((/[\u3040-\u9fff]/.test(n) && !/賞|Award|部門|学会/.test(n)) ||
                  (/^[A-Z][a-z]+ [A-Z]/.test(n)));
        });
      if (names.length > 0) {
        authors.push(...names);
        break;
      }
    }
  }

  // Pattern for English: "Award AuthorName, AuthorName: "Title""
  if (authors.length === 0) {
    const enMatch = raw.match(/Award\s+([A-Z][^:]+):\s*["']/i);
    if (enMatch) {
      const namesPart = enMatch[1].trim();
      const names = namesPart.split(/,\s*and\s*|,\s*|\s+and\s+/)
        .map(n => cleanName(n.trim()))
        .filter(n => n.length >= 2 && /^[A-Z]/.test(n) && !/Award/i.test(n));
      authors.push(...names);
    }
  }

  return authors;
}

// Find and fix matching YAML files
function findAndFixYamlFiles(awardName: string, missingAuthors: string[]): number {
  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));
  let fixed = 0;

  // Extract key title words
  const titleWords = awardName
    .replace(/[^\u3040-\u9fff\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 4);

  for (const file of files) {
    const filepath = path.join(PUBLICATIONS_DIR, file);
    const content = fs.readFileSync(filepath, 'utf-8');

    // Check if title matches
    const matchCount = titleWords.filter(w => content.includes(w)).length;
    if (matchCount < 2) continue;

    try {
      const pub = yaml.parse(content);
      if (!pub.authors || !Array.isArray(pub.authors)) continue;

      // Check if any missing authors are actually missing
      const actuallyMissing = missingAuthors.filter(missing =>
        !pub.authors.some((a: string) =>
          a.includes(missing) || missing.includes(a)
        )
      );

      if (actuallyMissing.length > 0) {
        // Add missing authors at the beginning (they're usually first authors)
        pub.authors = [...actuallyMissing, ...pub.authors];
        fs.writeFileSync(filepath, yaml.stringify(pub));
        console.log(`  Fixed ${file}: added [${actuallyMissing.join(', ')}]`);
        fixed++;
      }
    } catch (e) {
      // Skip invalid files
    }
  }

  return fixed;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('============================================================');
  console.log(`Fix Award Authors from Raw Data ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('============================================================\n');

  if (!fs.existsSync(AWARDS_FILE)) {
    console.log('Awards file not found:', AWARDS_FILE);
    return;
  }

  const awardsData = JSON.parse(fs.readFileSync(AWARDS_FILE, 'utf-8'));
  const awards: AwardEntry[] = awardsData.items || [];

  console.log(`Processing ${awards.length} awards...\n`);

  let totalFixed = 0;

  for (const award of awards) {
    if (!award._raw) continue;

    const extractedAuthors = extractAuthorsFromRaw(award._raw);
    if (extractedAuthors.length === 0) continue;

    // Check if we have more authors than what was parsed
    const currentAuthors = award.recipients || [];
    const missingAuthors = extractedAuthors.filter(a =>
      !currentAuthors.some(c => c.includes(a) || a.includes(c))
    );

    if (missingAuthors.length > 0) {
      console.log(`\nAward: ${award.awardName.slice(0, 60)}...`);
      console.log(`  Missing: [${missingAuthors.join(', ')}]`);

      if (!dryRun) {
        const fixed = findAndFixYamlFiles(award.awardName, missingAuthors);
        totalFixed += fixed;
      }
    }
  }

  console.log('\n============================================================');
  console.log(`Total files fixed: ${totalFixed}`);
  console.log('============================================================');
}

main().catch(console.error);
