/**
 * Analyze site structure for scraping
 * Run: npx ts-node scripts/analyze-site-structure.ts
 */

import puppeteer, { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.ne.t.u-tokyo.ac.jp';

const PAGES = [
  { name: 'index', url: '/' },
  { name: 'index-en', url: '/index-e.html' },
  { name: 'publications', url: '/pub.html' },
  { name: 'research', url: '/research.html' },
  { name: 'others', url: '/others.html' },
  { name: 'lectures', url: '/lecture.html' },
  { name: 'profile', url: '/profile.html' },
];

async function analyzePage(page: Page, url: string) {
  await page.goto(BASE_URL + url, { waitUntil: 'networkidle0', timeout: 30000 });

  return await page.evaluate(() => {
    // Count all tags
    const allElements = document.body.querySelectorAll('*');
    const tagCounts: Record<string, number> = {};
    allElements.forEach(el => {
      tagCounts[el.tagName] = (tagCounts[el.tagName] || 0) + 1;
    });

    // Get all headers with their text
    const headers: { tag: string; text: string; position: number }[] = [];
    ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].forEach(tag => {
      document.querySelectorAll(tag).forEach((el, i) => {
        headers.push({
          tag,
          text: el.textContent?.trim().substring(0, 100) || '',
          position: Array.from(document.body.querySelectorAll('*')).indexOf(el)
        });
      });
    });
    headers.sort((a, b) => a.position - b.position);

    // Get table structure
    const tables: { rows: number; cols: number; headerText: string[] }[] = [];
    document.querySelectorAll('table').forEach(table => {
      const rows = table.querySelectorAll('tr').length;
      const firstRow = table.querySelector('tr');
      const cols = firstRow ? firstRow.querySelectorAll('td, th').length : 0;
      const headerText: string[] = [];
      table.querySelectorAll('th').forEach(th => {
        headerText.push(th.textContent?.trim().substring(0, 50) || '');
      });
      tables.push({ rows, cols, headerText });
    });

    // Get list structure
    const lists: { type: string; itemCount: number; sampleItems: string[] }[] = [];
    document.querySelectorAll('ul, ol').forEach(list => {
      const items = list.querySelectorAll(':scope > li');
      const sampleItems: string[] = [];
      items.forEach((item, i) => {
        if (i < 3) {
          sampleItems.push(item.textContent?.trim().substring(0, 100) || '');
        }
      });
      lists.push({
        type: list.tagName,
        itemCount: items.length,
        sampleItems
      });
    });

    // Get links count
    const links = document.querySelectorAll('a[href]').length;

    // Get images
    const images: { src: string; alt: string }[] = [];
    document.querySelectorAll('img').forEach(img => {
      images.push({
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || ''
      });
    });

    // Get text content length
    const textLength = document.body.innerText.length;

    // Get first 500 chars of text to understand content
    const textPreview = document.body.innerText.substring(0, 500);

    // Find section markers (text patterns that indicate sections)
    const fullText = document.body.innerText;
    const sectionMarkers: { marker: string; position: number }[] = [];
    const markerPatterns = [
      '和文', '英文', '原著論文', '総説', '著書', '学会発表', '口頭発表',
      '国際会議', 'Review', 'Book', 'Original', 'Proceedings',
      'メンバー', 'Member', '研究', 'Research', '講義', 'Lecture',
      'その他', 'Others', 'プロフィール', 'Profile'
    ];
    markerPatterns.forEach(marker => {
      const pos = fullText.indexOf(marker);
      if (pos !== -1) {
        sectionMarkers.push({ marker, position: pos });
      }
    });
    sectionMarkers.sort((a, b) => a.position - b.position);

    return {
      tagCounts,
      headers,
      tables,
      lists,
      linksCount: links,
      images,
      textLength,
      textPreview,
      sectionMarkers
    };
  });
}

async function main() {
  console.log('Starting site structure analysis...\n');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const results: Record<string, any> = {
    analyzedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    pages: {}
  };

  for (const { name, url } of PAGES) {
    console.log(`Analyzing ${name} (${url})...`);
    try {
      const analysis = await analyzePage(page, url);
      results.pages[name] = {
        url,
        ...analysis
      };
      console.log(`  - ${analysis.textLength} chars, ${analysis.headers.length} headers, ${analysis.lists.length} lists`);
    } catch (error) {
      console.log(`  - ERROR: ${error}`);
      results.pages[name] = { url, error: String(error) };
    }
  }

  await browser.close();

  // Save results
  const outputPath = path.join(__dirname, '..', 'scraped', 'site-structure-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nAnalysis saved to: ${outputPath}`);
}

main().catch(console.error);
