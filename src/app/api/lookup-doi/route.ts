import { NextRequest, NextResponse } from 'next/server';

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

async function fetchArxiv(arxivId: string): Promise<any | null> {
  try {
    const url = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const xml = await res.text();

    // Simple XML parsing for arXiv
    const title = xml.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
    const authors = [...xml.matchAll(/<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g)]
      .map(m => m[1].trim());
    const published = xml.match(/<published>([^<]+)<\/published>/)?.[1];
    const year = published ? parseInt(published.slice(0, 4)) : undefined;

    if (!title) return null;

    return { title, authors, year, arxivId };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const doi = searchParams.get('doi');
  const arxiv = searchParams.get('arxiv');

  if (!doi && !arxiv) {
    return NextResponse.json({ error: 'Provide doi or arxiv parameter' }, { status: 400 });
  }

  if (doi) {
    // Clean DOI
    let cleanDoi = doi.trim();
    cleanDoi = cleanDoi.replace(/^https?:\/\/doi\.org\//, '');
    cleanDoi = cleanDoi.replace(/^doi:?\s*/i, '');

    const data = await fetchCrossRef(cleanDoi);

    if (!data) {
      return NextResponse.json({ error: 'DOI not found' }, { status: 404 });
    }

    // Parse CrossRef response
    const title = Array.isArray(data.title) ? data.title[0] : data.title;
    const authors = (data.author || []).map((a: any) => {
      if (a.given && a.family) return `${a.given} ${a.family}`;
      return a.name || a.family || '';
    }).filter(Boolean);

    let year = null;
    if (data['published-print']?.['date-parts']?.[0]?.[0]) {
      year = data['published-print']['date-parts'][0][0];
    } else if (data['published-online']?.['date-parts']?.[0]?.[0]) {
      year = data['published-online']['date-parts'][0][0];
    }

    let type = 'journal';
    if (data.type === 'proceedings-article') type = 'conference';
    else if (data.type === 'book-chapter') type = 'book';

    return NextResponse.json({
      source: 'crossref',
      doi: data.DOI,
      title,
      authors,
      journal: data['container-title']?.[0],
      year,
      volume: data.volume,
      issue: data.issue,
      pages: data.page,
      type,
      url: data.URL,
    });
  }

  if (arxiv) {
    // Clean arXiv ID
    let cleanArxiv = arxiv.trim();
    cleanArxiv = cleanArxiv.replace(/^https?:\/\/arxiv\.org\/abs\//, '');
    cleanArxiv = cleanArxiv.replace(/^arxiv:?\s*/i, '');

    const data = await fetchArxiv(cleanArxiv);

    if (!data) {
      return NextResponse.json({ error: 'arXiv paper not found' }, { status: 404 });
    }

    return NextResponse.json({
      source: 'arxiv',
      arxiv: cleanArxiv,
      title: data.title,
      authors: data.authors,
      year: data.year,
      type: 'preprint',
      url: `https://arxiv.org/abs/${cleanArxiv}`,
    });
  }
}
