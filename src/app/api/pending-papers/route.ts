import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PENDING_FILE = path.join(process.cwd(), 'content', 'publications', 'pending.json');

export async function GET() {
  if (!fs.existsSync(PENDING_FILE)) {
    return NextResponse.json({ papers: [], total: 0 });
  }

  const papers = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
  const pending = papers.filter((p: any) => p.status === 'pending');

  return NextResponse.json({
    papers: pending,
    total: pending.length,
    lastUpdated: fs.statSync(PENDING_FILE).mtime.toISOString(),
  });
}
