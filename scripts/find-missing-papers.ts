import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const AUTHOR_ID = 'A5014759071'; // Hirokazu Takahashi

async function main() {
  // Load existing papers
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const existingTitles = new Set<string>();
  const existingDois = new Set<string>();

  fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml')).forEach(file => {
    const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8')) as any;
    if (data.title) existingTitles.add(data.title.toLowerCase().slice(0, 50));
    if (data.doi) existingDois.add(data.doi.toLowerCase().replace('https://doi.org/', ''));
  });

  console.log('Existing papers in database:', existingTitles.size);

  // Fetch from OpenAlex
  const url = `https://api.openalex.org/works?filter=author.id:${AUTHOR_ID},publication_year:2020-2025&per_page=100&sort=publication_year:desc`;
  const response = await fetch(url);
  const data = await response.json();

  console.log('OpenAlex papers (2020-2025):', data.meta?.count);
  console.log('\n=== MISSING PAPERS ===\n');

  let missing = 0;
  for (const w of data.results || []) {
    const doi = (w.doi || '').toLowerCase().replace('https://doi.org/', '');
    const titleStart = (w.title || '').toLowerCase().slice(0, 50);

    const hasDoi = doi && existingDois.has(doi);
    const hasTitle = existingTitles.has(titleStart);

    if (!hasDoi && !hasTitle) {
      missing++;
      console.log(`[${w.publication_year}] ${(w.title || '').slice(0, 70)}`);
      console.log(`    DOI: ${w.doi || 'none'}`);
      console.log(`    Type: ${w.type}`);
      console.log('');
    }
  }

  console.log('---');
  console.log('Total missing:', missing);
}

main().catch(console.error);
