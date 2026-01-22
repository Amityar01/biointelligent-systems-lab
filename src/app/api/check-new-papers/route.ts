import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Researchmap API for fetching publications
const RESEARCHMAP_ID = '1000080177'; // Prof. Takahashi's researchmap ID
const RESEARCHMAP_API = `https://api.researchmap.jp/${RESEARCHMAP_ID}/published_papers`;

const PENDING_FILE = path.join(process.cwd(), 'content', 'publications', 'pending.json');
const PUBLICATIONS_DIR = path.join(process.cwd(), 'content', 'publications');

interface ResearchmapPaper {
  rm_id: string;
  paper_title: { ja?: string; en?: string };
  authors: { ja?: string; en?: string };
  publication_name: { ja?: string; en?: string };
  publication_date?: string;
  volume?: string;
  issue?: string;
  starting_page?: string;
  ending_page?: string;
  identifiers?: { identifier_type: string; identifier: string }[];
}

interface PendingPaper {
  id: string;
  source: 'researchmap' | 'orcid' | 'manual';
  sourceId: string;
  title: string;
  titleJa?: string;
  authors: string[];
  journal?: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  fetchedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

function loadExistingDois(): Set<string> {
  const dois = new Set<string>();

  if (!fs.existsSync(PUBLICATIONS_DIR)) return dois;

  const files = fs.readdirSync(PUBLICATIONS_DIR).filter(f => f.endsWith('.yaml'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(PUBLICATIONS_DIR, file), 'utf-8');
    const doiMatch = content.match(/^doi:\s*["']?([^"'\n]+)["']?/m);
    if (doiMatch) {
      dois.add(doiMatch[1].toLowerCase());
    }
  }

  return dois;
}

function loadPendingPapers(): PendingPaper[] {
  if (!fs.existsSync(PENDING_FILE)) return [];
  return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
}

function savePendingPapers(papers: PendingPaper[]) {
  const dir = path.dirname(PENDING_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PENDING_FILE, JSON.stringify(papers, null, 2));
}

function parseAuthors(authorsStr: string): string[] {
  if (!authorsStr) return [];
  // Split by common delimiters
  return authorsStr
    .split(/[,;、，]/)
    .map(a => a.trim())
    .filter(a => a.length > 0);
}

function generateId(paper: ResearchmapPaper): string {
  const year = paper.publication_date?.slice(0, 4) || 'unknown';
  const title = (paper.paper_title.en || paper.paper_title.ja || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  return `${year}-${title}`;
}

async function fetchResearchmap(): Promise<ResearchmapPaper[]> {
  try {
    const response = await fetch(RESEARCHMAP_API, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.error('Researchmap API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data['@graph'] || [];
  } catch (error) {
    console.error('Failed to fetch from researchmap:', error);
    return [];
  }
}

export async function GET() {
  // This endpoint checks for new papers and updates pending list

  const existingDois = loadExistingDois();
  const pendingPapers = loadPendingPapers();
  const pendingDois = new Set(pendingPapers.map(p => p.doi?.toLowerCase()).filter(Boolean));

  // Fetch from researchmap
  const researchmapPapers = await fetchResearchmap();

  let newCount = 0;

  for (const paper of researchmapPapers) {
    // Extract DOI if present
    const doiIdentifier = paper.identifiers?.find(i => i.identifier_type === 'doi');
    const doi = doiIdentifier?.identifier;

    // Skip if already exists or already pending
    if (doi) {
      const doiLower = doi.toLowerCase();
      if (existingDois.has(doiLower) || pendingDois.has(doiLower)) {
        continue;
      }
    }

    // Skip if already in pending by source ID
    if (pendingPapers.some(p => p.sourceId === paper.rm_id)) {
      continue;
    }

    // Parse year from publication_date
    const year = paper.publication_date ? parseInt(paper.publication_date.slice(0, 4)) : undefined;

    // Parse pages
    const pages = paper.starting_page && paper.ending_page
      ? `${paper.starting_page}-${paper.ending_page}`
      : paper.starting_page || undefined;

    const pending: PendingPaper = {
      id: generateId(paper),
      source: 'researchmap',
      sourceId: paper.rm_id,
      title: paper.paper_title.en || paper.paper_title.ja || '',
      titleJa: paper.paper_title.ja,
      authors: parseAuthors(paper.authors?.en || paper.authors?.ja || ''),
      journal: paper.publication_name?.en || paper.publication_name?.ja,
      year,
      volume: paper.volume,
      issue: paper.issue,
      pages,
      doi,
      fetchedAt: new Date().toISOString(),
      status: 'pending',
    };

    pendingPapers.push(pending);
    newCount++;
  }

  // Save updated pending list
  savePendingPapers(pendingPapers);

  return NextResponse.json({
    success: true,
    newPapers: newCount,
    totalPending: pendingPapers.filter(p => p.status === 'pending').length,
    checkedAt: new Date().toISOString(),
    sources: ['researchmap'],
  });
}

// Cron job endpoint
export async function POST() {
  // Same as GET but designed for cron
  return GET();
}
