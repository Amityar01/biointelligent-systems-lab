/**
 * Fetch abstracts for publications that have DOIs
 * Uses OpenAlex, Semantic Scholar, CrossRef, and PubMed as fallbacks
 * Updates YAML files directly
 *
 * Usage: npx tsx scripts/fetch-abstracts.ts
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const OPENALEX_API = 'https://api.openalex.org/works/doi:';
const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1/paper';
const CROSSREF_API = 'https://api.crossref.org/works';
const PUBMED_SEARCH_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_FETCH_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

// Rate limit: 1 request per second
const DELAY_MS = 1000;

interface Publication {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  abstract?: string;
  [key: string]: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reconstruct abstract from OpenAlex inverted index format
 */
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const positions: [string, number][] = [];
  for (const [word, indices] of Object.entries(invertedIndex)) {
    for (const idx of indices) {
      positions.push([word, idx]);
    }
  }
  positions.sort((a, b) => a[1] - b[1]);
  return positions.map(p => p[0]).join(' ');
}

async function fetchFromOpenAlex(doi: string): Promise<string | null> {
  try {
    const url = `${OPENALEX_API}${doi}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'mailto:takahashi@i.u-tokyo.ac.jp'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.abstract_inverted_index) {
      return reconstructAbstract(data.abstract_inverted_index);
    }
    return null;
  } catch (err) {
    console.error(`  OpenAlex error: ${err}`);
    return null;
  }
}

async function fetchFromSemanticScholar(doi: string): Promise<string | null> {
  try {
    const url = `${SEMANTIC_SCHOLAR_API}/DOI:${doi}?fields=abstract`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = await response.json();
    return data.abstract || null;
  } catch (err) {
    console.error(`  Semantic Scholar error: ${err}`);
    return null;
  }
}

async function fetchFromCrossRef(doi: string): Promise<string | null> {
  try {
    const url = `${CROSSREF_API}/${doi}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LabWebsite/1.0 (mailto:takahashi@i.u-tokyo.ac.jp)'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const abstract = data.message?.abstract;

    if (abstract) {
      // CrossRef abstracts often have JATS XML tags, clean them
      return abstract
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return null;
  } catch (err) {
    console.error(`  CrossRef error: ${err}`);
    return null;
  }
}

async function fetchFromPubMed(doi: string): Promise<string | null> {
  try {
    // First, search for PMID using DOI
    const searchUrl = `${PUBMED_SEARCH_API}?db=pubmed&term=${encodeURIComponent(doi)}[doi]&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const pmids = searchData.esearchresult?.idlist;
    if (!pmids || pmids.length === 0) return null;

    const pmid = pmids[0];

    // Fetch abstract using PMID
    const fetchUrl = `${PUBMED_FETCH_API}?db=pubmed&id=${pmid}&rettype=abstract&retmode=text`;
    const fetchResponse = await fetch(fetchUrl);
    if (!fetchResponse.ok) return null;

    const text = await fetchResponse.text();

    // Extract abstract from the text response
    // PubMed format has sections like "Author information:", then abstract text
    const lines = text.split('\n');
    let inAbstract = false;
    let abstractLines: string[] = [];

    for (const line of lines) {
      // Abstract typically starts after author info and before keywords/DOI
      if (line.match(/^(BACKGROUND|INTRODUCTION|OBJECTIVE|PURPOSE|METHODS|RESULTS|CONCLUSION|AIMS|CONTEXT):/i) ||
          (inAbstract && line.trim() && !line.match(/^(Copyright|DOI:|PMID:|Keywords:)/i))) {
        inAbstract = true;
        abstractLines.push(line.trim());
      } else if (inAbstract && (line.match(/^(Copyright|DOI:|PMID:)/i) || line.trim() === '')) {
        if (abstractLines.length > 0) break;
      }
    }

    if (abstractLines.length > 0) {
      return abstractLines.join(' ').replace(/\s+/g, ' ').trim();
    }
    return null;
  } catch (err) {
    console.error(`  PubMed error: ${err}`);
    return null;
  }
}

function loadPublicationsWithDoi(): { filePath: string; data: Publication }[] {
  const pubsDir = path.join(process.cwd(), 'content', 'publications');
  const results: { filePath: string; data: Publication }[] = [];

  const files = fs.readdirSync(pubsDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  for (const file of files) {
    const filePath = path.join(pubsDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.load(content) as Publication;

      // Only include if has DOI and no abstract yet
      if (data.doi && !data.abstract) {
        results.push({ filePath, data });
      }
    } catch (err) {
      console.error(`Error loading ${file}:`, err);
    }
  }

  return results;
}

function savePublication(filePath: string, data: Publication): void {
  const content = yaml.dump(data, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
  });
  fs.writeFileSync(filePath, content);
}

async function main() {
  console.log('=== Fetch Abstracts for Publications with DOI ===\n');

  const publications = loadPublicationsWithDoi();
  console.log(`Found ${publications.length} publications with DOI but no abstract\n`);

  if (publications.length === 0) {
    console.log('Nothing to do!');
    return;
  }

  let fetched = 0;
  let failed = 0;

  for (let i = 0; i < publications.length; i++) {
    const { filePath, data } = publications[i];
    const title = data.title?.slice(0, 50) || data.id;

    console.log(`[${i + 1}/${publications.length}] ${title}...`);
    console.log(`  DOI: ${data.doi}`);

    // Try OpenAlex first (best coverage)
    let abstract = await fetchFromOpenAlex(data.doi!);
    let source = 'OpenAlex';

    if (!abstract) {
      console.log('  OpenAlex: no abstract, trying Semantic Scholar...');
      await sleep(DELAY_MS);
      abstract = await fetchFromSemanticScholar(data.doi!);
      source = 'Semantic Scholar';
    }

    if (!abstract) {
      console.log('  Semantic Scholar: no abstract, trying CrossRef...');
      await sleep(DELAY_MS);
      abstract = await fetchFromCrossRef(data.doi!);
      source = 'CrossRef';
    }

    if (!abstract) {
      console.log('  CrossRef: no abstract, trying PubMed...');
      await sleep(DELAY_MS);
      abstract = await fetchFromPubMed(data.doi!);
      source = 'PubMed';
    }

    if (abstract) {
      console.log(`  ✓ Found via ${source} (${abstract.length} chars)`);
      data.abstract = abstract;
      savePublication(filePath, data);
      fetched++;
    } else {
      console.log('  ✗ No abstract found');
      failed++;
    }

    // Rate limit
    if (i < publications.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Fetched: ${fetched}`);
  console.log(`Not found: ${failed}`);
}

main().catch(console.error);
