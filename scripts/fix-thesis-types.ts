/**
 * Fix thesis entries that are incorrectly typed as "presentation"
 * - Identifies theses by looking for 卒業論文/修士論文/博士論文 in conference field
 * - Changes type from "presentation" to "thesis"
 * - Moves conference content to "institution" field
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
  type?: string;
  conference?: string;
  institution?: string;
  [key: string]: any;
}

const THESIS_PATTERNS = [
  /卒業論文/,    // Undergraduate thesis
  /修士論文/,    // Master's thesis
  /博士論文/,    // Doctoral thesis
  /学位論文/,    // Degree thesis (general)
];

function isThesis(pub: Publication): boolean {
  const conference = pub.conference || '';
  return THESIS_PATTERNS.some(pattern => pattern.test(conference));
}

function getThesisType(conference: string): string {
  if (/博士論文/.test(conference)) return 'doctoral';
  if (/修士論文/.test(conference)) return 'masters';
  if (/卒業論文/.test(conference)) return 'undergraduate';
  return 'thesis';
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('============================================================');
  console.log(`Fix Thesis Types ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('============================================================\n');

  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));
  console.log(`Scanning ${files.length} files...\n`);

  let fixed = 0;

  for (const file of files) {
    const filepath = path.join(PUBLICATIONS_DIR, file);
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const pub = yaml.parse(content) as Publication;

      if (isThesis(pub) && pub.type !== 'thesis') {
        const thesisType = getThesisType(pub.conference || '');
        console.log(`${file}:`);
        console.log(`  Title: ${pub.title?.slice(0, 50)}...`);
        console.log(`  Type: ${pub.type} → thesis`);
        console.log(`  Thesis type: ${thesisType}`);
        console.log(`  Institution: ${pub.conference}`);

        if (!dryRun) {
          pub.type = 'thesis';
          pub.institution = pub.conference;
          delete pub.conference;
          fs.writeFileSync(filepath, yaml.stringify(pub));
        }
        fixed++;
        console.log('');
      }
    } catch (e) {
      console.error(`Error processing ${file}: ${e}`);
    }
  }

  console.log('============================================================');
  console.log(`Fixed ${fixed} thesis entries`);
  console.log('============================================================');
}

main().catch(console.error);
