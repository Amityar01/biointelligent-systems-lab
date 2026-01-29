import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const AUTHOR_ID = 'A5014759071'; // Hirokazu Takahashi
const YEAR_RANGE = process.argv[2] || '2020-2025'; // Can pass year range as argument

async function main() {
  // Load existing DOIs and titles
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const existingDois = new Set<string>();
  const existingTitles = new Set<string>();

  fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml')).forEach(file => {
    const data = yaml.load(fs.readFileSync(path.join(pubsDir, file), 'utf-8')) as any;
    if (data.doi) existingDois.add(data.doi.toLowerCase().replace('https://doi.org/', ''));
    if (data.title) existingTitles.add(data.title.toLowerCase().slice(0, 40));
  });

  // Fetch from OpenAlex
  console.log('Year range:', YEAR_RANGE);
  const url = `https://api.openalex.org/works?filter=author.id:${AUTHOR_ID},publication_year:${YEAR_RANGE}&per_page=100&sort=publication_year:desc`;
  const response = await fetch(url);
  const data = await response.json();

  console.log('OpenAlex 2024-2025 papers:', data.meta?.count);
  console.log('');

  const missing: any[] = [];

  for (const w of data.results || []) {
    const doi = (w.doi || '').toLowerCase().replace('https://doi.org/', '');
    const titleStart = (w.title || '').toLowerCase().slice(0, 40);

    // Check if already exists
    if (doi && existingDois.has(doi)) continue;
    if (existingTitles.has(titleStart)) continue;

    // Filter for neuroscience papers
    const title = (w.title || '').toLowerCase();
    const isNeuro = title.includes('neural') || title.includes('brain') || title.includes('auditory') ||
        title.includes('cortex') || title.includes('neuron') || title.includes('vagus') ||
        title.includes('culture') || title.includes('deviance') || title.includes('omission') ||
        title.includes('prediction') || title.includes('dopamine') || title.includes('reservoir') ||
        title.includes('mismatch') || title.includes('tinnitus');

    if (isNeuro) {
      missing.push(w);
    }
  }

  console.log('=== MISSING NEUROSCIENCE PAPERS ===\n');

  for (const w of missing) {
    console.log(`[${w.publication_year}] ${w.title}`);
    console.log(`    DOI: ${w.doi || 'none'}`);
    console.log(`    Type: ${w.type}`);
    console.log('');
  }

  console.log('Total missing:', missing.length);
  console.log('\n--- Creating YAML files ---\n');

  // Create YAML files for missing papers
  for (const w of missing) {
    const authors = (w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean);
    const doi = (w.doi || '').replace('https://doi.org/', '');

    // Generate filename
    const firstAuthor = (authors[0] || 'unknown').replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 10);
    const titleSlug = (w.title || '').replace(/[^a-zA-Z ]/g, '').toLowerCase().split(' ').slice(0, 4).join('-');
    const id = `${w.publication_year}-${firstAuthor}-${titleSlug}`.slice(0, 60);
    const filename = `${id}.yaml`;

    // Determine type
    let type = 'journal';
    if (w.type === 'preprint') type = 'preprint';
    else if (w.type === 'review') type = 'review';
    else if ((w.doi || '').includes('arxiv') || (w.doi || '').includes('biorxiv')) type = 'preprint';

    // Get abstract
    let abstract = '';
    if (w.abstract_inverted_index) {
      const positions: [string, number][] = [];
      for (const [word, indices] of Object.entries(w.abstract_inverted_index)) {
        for (const idx of indices as number[]) {
          positions.push([word, idx]);
        }
      }
      positions.sort((a, b) => a[1] - b[1]);
      abstract = positions.map(p => p[0]).join(' ');
    }

    const paper = {
      id,
      title: w.title,
      authors,
      year: w.publication_year,
      type,
      ...(doi && { doi }),
      tags: ['english'],
      ...(abstract && { abstract }),
    };

    const yamlContent = yaml.dump(paper, { lineWidth: -1, quotingType: '"', forceQuotes: false });
    const filePath = path.join(pubsDir, filename);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, yamlContent);
      console.log('Created:', filename);
    } else {
      console.log('Skipped (exists):', filename);
    }
  }
}

main().catch(console.error);
