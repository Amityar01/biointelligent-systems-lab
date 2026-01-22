/**
 * Add all grants from original site
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLICATIONS_DIR = path.join(__dirname, '..', 'content', 'publications');
const GRANTS_JSON = path.join(__dirname, '..', 'scraped', 'parsed', 'grants-all.json');

interface Grant {
  id: string;
  title: string;
  pi?: string;
  funder?: string;
  startYear?: number;
  endYear?: number;
  role?: string;
  _raw?: string;
}

function createSlug(title: string, index: number): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^\w\u3040-\u9fff]+/g, '-')
    .slice(0, 30)
    .replace(/-+$/, '');

  return `grant-${titleSlug}-${index}`;
}

async function main() {
  console.log('============================================================');
  console.log('ADD GRANTS FROM ORIGINAL SITE');
  console.log('============================================================\n');

  const data = JSON.parse(fs.readFileSync(GRANTS_JSON, 'utf-8'));
  const grants: Grant[] = data.items || [];

  console.log(`Total grants in JSON: ${grants.length}\n`);

  // Check existing grants
  const existingTitles = new Set<string>();
  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));

  for (const f of files) {
    const content = fs.readFileSync(path.join(PUBLICATIONS_DIR, f), 'utf-8');
    const pub = yaml.parse(content);
    if (pub.type === 'grant') {
      existingTitles.add(pub.title?.toLowerCase().slice(0, 20) || '');
    }
  }

  console.log(`Existing grant files: ${existingTitles.size}\n`);

  let added = 0;

  for (let i = 0; i < grants.length; i++) {
    const grant = grants[i];
    const title = grant.title;

    if (!title || title.length < 5) continue;

    // Skip if already exists
    if (existingTitles.has(title.toLowerCase().slice(0, 20))) {
      console.log(`Skipping (exists): ${title.slice(0, 40)}...`);
      continue;
    }

    const pub = {
      id: `grant-${i + 1}`,
      title: title,
      authors: grant.pi ? [grant.pi] : ['高橋宏知'],
      year: grant.startYear,
      endYear: grant.endYear,
      type: 'grant',
      funder: grant.funder,
      role: grant.role,
      tags: ['japanese'],
    };

    // Remove undefined fields
    Object.keys(pub).forEach(key => {
      if (pub[key as keyof typeof pub] === undefined) {
        delete pub[key as keyof typeof pub];
      }
    });

    const filename = createSlug(title, i + 1) + '.yaml';
    fs.writeFileSync(
      path.join(PUBLICATIONS_DIR, filename),
      yaml.stringify(pub)
    );

    console.log(`Added: ${title.slice(0, 50)}...`);
    existingTitles.add(title.toLowerCase().slice(0, 20));
    added++;
  }

  console.log('\n============================================================');
  console.log(`Grants added: ${added}`);
  console.log(`Total grants now: ${existingTitles.size}`);
  console.log('============================================================');
}

main().catch(console.error);
