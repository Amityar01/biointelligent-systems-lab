import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PENDING_FILE = path.join(process.cwd(), 'content', 'publications', 'pending.json');
const PUBLICATIONS_DIR = path.join(process.cwd(), 'content', 'publications');

interface PendingPaper {
  id: string;
  source: string;
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

async function fetchCrossRef(doi: string): Promise<any | null> {
  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LabWebsite/1.0 (mailto:takahashi@i.u-tokyo.ac.jp)' }
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.message;
  } catch {
    return null;
  }
}

function generateYaml(paper: PendingPaper, crossrefData?: any): string {
  // Use CrossRef data if available, otherwise use pending data
  let title = paper.title;
  let authors = paper.authors;
  let journal = paper.journal || '';
  let year = paper.year;
  let volume = paper.volume;
  let pages = paper.pages;

  if (crossrefData) {
    title = Array.isArray(crossrefData.title) ? crossrefData.title[0] : crossrefData.title || title;

    if (crossrefData.author?.length) {
      authors = crossrefData.author.map((a: any) => {
        if (a.given && a.family) return `${a.given} ${a.family}`;
        return a.name || a.family || '';
      }).filter(Boolean);
    }

    if (crossrefData['container-title']?.[0]) {
      journal = crossrefData['container-title'][0];
    }

    if (crossrefData['published-print']?.['date-parts']?.[0]?.[0]) {
      year = crossrefData['published-print']['date-parts'][0][0];
    } else if (crossrefData['published-online']?.['date-parts']?.[0]?.[0]) {
      year = crossrefData['published-online']['date-parts'][0][0];
    }

    volume = crossrefData.volume || volume;
    pages = crossrefData.page || pages;
  }

  // Determine type
  let type = 'journal';
  if (crossrefData?.type === 'proceedings-article') type = 'conference';
  else if (crossrefData?.type === 'book-chapter') type = 'book';

  // Build YAML
  const lines: string[] = [
    `id: "${paper.id}"`,
    `title: "${title.replace(/"/g, '\\"')}"`,
    `authors:`,
  ];

  for (const author of authors) {
    lines.push(`  - "${author.replace(/"/g, '\\"')}"`);
  }

  if (journal) lines.push(`journal: "${journal.replace(/"/g, '\\"')}"`);
  if (year) lines.push(`year: ${year}`);
  if (volume) lines.push(`volume: "${volume}"`);
  if (pages) lines.push(`pages: "${pages}"`);
  if (paper.doi) lines.push(`doi: "${paper.doi}"`);
  lines.push(`type: "${type}"`);

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const { id, action } = await request.json();

    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!fs.existsSync(PENDING_FILE)) {
      return NextResponse.json({ error: 'No pending papers' }, { status: 404 });
    }

    const papers: PendingPaper[] = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
    const paperIndex = papers.findIndex(p => p.id === id);

    if (paperIndex === -1) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    const paper = papers[paperIndex];

    if (action === 'approve') {
      // Fetch CrossRef data if DOI available
      let crossrefData = null;
      if (paper.doi) {
        crossrefData = await fetchCrossRef(paper.doi);
      }

      // Generate YAML content
      const yamlContent = generateYaml(paper, crossrefData);

      // Write YAML file
      const filename = `${paper.id}.yaml`;
      const filepath = path.join(PUBLICATIONS_DIR, filename);

      if (!fs.existsSync(PUBLICATIONS_DIR)) {
        fs.mkdirSync(PUBLICATIONS_DIR, { recursive: true });
      }

      fs.writeFileSync(filepath, yamlContent);

      // Update status
      papers[paperIndex].status = 'approved';
      fs.writeFileSync(PENDING_FILE, JSON.stringify(papers, null, 2));

      return NextResponse.json({
        success: true,
        action: 'approved',
        file: filename,
        usedCrossRef: !!crossrefData,
      });
    } else {
      // Reject
      papers[paperIndex].status = 'rejected';
      fs.writeFileSync(PENDING_FILE, JSON.stringify(papers, null, 2));

      return NextResponse.json({
        success: true,
        action: 'rejected',
      });
    }
  } catch (error) {
    console.error('Approve paper error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
