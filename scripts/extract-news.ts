import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../content/news');
const JSON_OUTPUT = path.join(__dirname, '../scraped/news-extracted.json');

interface NewsEntry {
  date: string;
  content: string;
}

async function extractNews(): Promise<NewsEntry[]> {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to lab site...');
  await page.goto('https://www.ne.t.u-tokyo.ac.jp/', { waitUntil: 'networkidle2' });

  console.log('Extracting news entries...');
  const entries = await page.evaluate(() => {
    const html = document.body.innerHTML;
    const newsMatch = html.match(/<h3>NEWS<\/h3>([\s\S]*?)(?=<h3>|このページの先頭へ|$)/i);
    if (!newsMatch) return [];

    const newsHtml = newsMatch[1];
    const temp = document.createElement('div');
    temp.innerHTML = newsHtml;

    function getTextWithLinks(el: Element): string {
      let result = '';
      el.childNodes.forEach(node => {
        if (node.nodeType === 3) {
          result += node.textContent;
        } else if (node.nodeName === 'A') {
          const href = (node as HTMLAnchorElement).getAttribute('href');
          const text = node.textContent?.trim();
          if (href && text) {
            result += `[${text}](${href})`;
          }
        } else if (node.nodeName === 'BR') {
          result += '\n';
        } else if ((node as Element).childNodes?.length) {
          result += getTextWithLinks(node as Element);
        }
      });
      return result;
    }

    const text = getTextWithLinks(temp);
    const parts = text.split(/(\d{4}年\d{1,2}月\d{1,2}日)/);
    const entries: { date: string; content: string }[] = [];

    for (let i = 1; i < parts.length; i += 2) {
      const date = parts[i];
      let content = parts[i + 1] ? parts[i + 1].trim() : '';
      // Clean up extra whitespace but preserve line breaks
      content = content.replace(/\n\s+/g, '\n').trim();
      if (content) entries.push({ date, content });
    }

    return entries;
  });

  await browser.close();
  return entries;
}

function parseJapaneseDate(dateStr: string): { year: number; month: number; day: number } | null {
  const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return null;
  return {
    year: parseInt(match[1]),
    month: parseInt(match[2]),
    day: parseInt(match[3])
  };
}

function generateId(date: { year: number; month: number; day: number }, content: string, index: number): string {
  const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;

  // Extract first meaningful word from content for slug
  const firstLine = content.split('\n')[0];
  let slug = '';

  // Try to extract event name or key word
  if (firstLine.includes('（') || firstLine.includes('(')) {
    slug = firstLine.split(/[（(]/)[0].trim();
  } else {
    slug = firstLine.substring(0, 30);
  }

  // Convert to URL-safe slug
  slug = slug
    .toLowerCase()
    .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);

  if (!slug) slug = `item-${index}`;

  return `${dateStr}-${slug}`;
}

function extractTitle(content: string): { en: string; ja: string } {
  const firstLine = content.split('\n')[0].replace(/\[link\]\([^)]+\)/g, '').trim();

  // Remove location in parentheses for cleaner title
  const cleanTitle = firstLine.replace(/[（(][^）)]+[）)]\s*$/, '').trim();

  return {
    en: cleanTitle,
    ja: cleanTitle
  };
}

function determineCategory(content: string): string {
  const lower = content.toLowerCase();
  const ja = content;

  if (ja.includes('論文発表') || ja.includes('Frontiers') || ja.includes('Nature') ||
      ja.includes('Science') || ja.includes('PLOS') || ja.includes('発表しました')) {
    return 'publication';
  }
  if (ja.includes('受賞') || ja.includes('Award') || ja.includes('賞')) {
    return 'award';
  }
  if (ja.includes('博士') || ja.includes('修士') || ja.includes('卒業') || ja.includes('PhD')) {
    return 'graduation';
  }
  if (ja.includes('教授') || ja.includes('准教授') || ja.includes('着任') || ja.includes('異動')) {
    return 'announcement';
  }
  // Default to event for conferences, presentations, etc.
  return 'event';
}

async function main() {
  console.log('='.repeat(60));
  console.log('News Extractor - Full Content Preservation');
  console.log('='.repeat(60));

  const entries = await extractNews();
  console.log(`\nExtracted ${entries.length} news entries`);

  // Save raw JSON
  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(entries, null, 2), 'utf-8');
  console.log(`Saved raw JSON to ${JSON_OUTPUT}`);

  // Clear existing news files
  if (fs.existsSync(OUTPUT_DIR)) {
    const existing = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.md'));
    console.log(`\nRemoving ${existing.length} existing news files...`);
    existing.forEach(f => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
  } else {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate markdown files
  console.log('\nGenerating markdown files...');
  let created = 0;
  const usedIds = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const date = parseJapaneseDate(entry.date);
    if (!date) {
      console.warn(`  Skipping entry with invalid date: ${entry.date}`);
      continue;
    }

    let id = generateId(date, entry.content, i);

    // Handle duplicate IDs
    let suffix = 1;
    const baseId = id;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix++}`;
    }
    usedIds.add(id);

    const title = extractTitle(entry.content);
    const category = determineCategory(entry.content);
    const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;

    // Extract link if present
    const linkMatch = entry.content.match(/\[link\]\(([^)]+)\)/);
    const link = linkMatch ? linkMatch[1] : null;

    // Build YAML frontmatter
    let yaml = `---
id: ${id}
title:
  en: "${title.en.replace(/"/g, '\\"')}"
  ja: "${title.ja.replace(/"/g, '\\"')}"
date: ${dateStr}
category: ${category}`;

    if (link && link.startsWith('http')) {
      yaml += `\nlink: ${link}`;
    }

    yaml += `\n---\n\n`;

    // Content body - preserve the full raw text
    const body = entry.content;

    const markdown = yaml + body + '\n';
    const filename = `${id}.md`;

    fs.writeFileSync(path.join(OUTPUT_DIR, filename), markdown, 'utf-8');
    created++;

    if (created % 50 === 0) {
      console.log(`  Created ${created} files...`);
    }
  }

  console.log(`\n✓ Created ${created} news files in ${OUTPUT_DIR}`);
}

main().catch(console.error);
