/**
 * Full site scraper - extracts all content to JSON files
 * Run: npx ts-node scripts/scrape-site.ts
 */

import puppeteer, { Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.ne.t.u-tokyo.ac.jp';
const OUTPUT_DIR = path.join(__dirname, '..', 'scraped');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function saveJson(filename: string, data: any) {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  Saved: ${filename}`);
}

// ============================================
// INDEX PAGE SCRAPER
// ============================================
async function scrapeIndex(page: Page) {
  console.log('Scraping index page...');
  await page.goto(BASE_URL + '/', { waitUntil: 'networkidle0', timeout: 60000 });

  const data = await page.evaluate(() => {
    const result: any = {
      title: document.title,
      sections: [],
      images: [],
      links: []
    };

    // Get all images
    document.querySelectorAll('img').forEach(img => {
      result.images.push({
        src: img.src,
        alt: img.alt || ''
      });
    });

    // Get all links
    document.querySelectorAll('a[href]').forEach(a => {
      result.links.push({
        href: a.getAttribute('href'),
        text: a.textContent?.trim().substring(0, 200) || ''
      });
    });

    // Get all text content by sections (h2, h3, h4)
    const headers = document.querySelectorAll('h2, h3, h4');
    headers.forEach(header => {
      const section: any = {
        level: header.tagName,
        title: header.textContent?.trim() || '',
        content: []
      };

      // Get content until next header
      let el = header.nextElementSibling;
      while (el && !['H2', 'H3', 'H4'].includes(el.tagName)) {
        if (el.textContent?.trim()) {
          section.content.push(el.textContent.trim());
        }
        el = el.nextElementSibling;
      }

      if (section.title || section.content.length > 0) {
        result.sections.push(section);
      }
    });

    // Get full text
    result.fullText = document.body.innerText;

    return result;
  });

  saveJson('index.json', data);
}

// ============================================
// INDEX-EN PAGE SCRAPER
// ============================================
async function scrapeIndexEn(page: Page) {
  console.log('Scraping index-en page...');
  await page.goto(BASE_URL + '/index-e.html', { waitUntil: 'networkidle0', timeout: 60000 });

  const data = await page.evaluate(() => {
    const result: any = {
      title: document.title,
      sections: [],
      images: [],
      links: []
    };

    // Get all images
    document.querySelectorAll('img').forEach(img => {
      result.images.push({
        src: img.src,
        alt: img.alt || ''
      });
    });

    // Get all links
    document.querySelectorAll('a[href]').forEach(a => {
      result.links.push({
        href: a.getAttribute('href'),
        text: a.textContent?.trim().substring(0, 200) || ''
      });
    });

    // Get all text content by sections
    const headers = document.querySelectorAll('h2, h3, h4, h5');
    headers.forEach(header => {
      const section: any = {
        level: header.tagName,
        title: header.textContent?.trim() || '',
        content: []
      };

      let el = header.nextElementSibling;
      while (el && !['H2', 'H3', 'H4', 'H5'].includes(el.tagName)) {
        if (el.textContent?.trim()) {
          section.content.push(el.textContent.trim());
        }
        el = el.nextElementSibling;
      }

      if (section.title || section.content.length > 0) {
        result.sections.push(section);
      }
    });

    result.fullText = document.body.innerText;

    return result;
  });

  saveJson('index-en.json', data);
}

// ============================================
// PUBLICATIONS PAGE SCRAPER
// ============================================
async function scrapePublications(page: Page) {
  console.log('Scraping publications page...');
  await page.goto(BASE_URL + '/pub.html', { waitUntil: 'networkidle0', timeout: 60000 });

  const data = await page.evaluate(() => {
    const fullText = document.body.innerText;
    const result: any = {
      title: document.title,
      scrapedAt: new Date().toISOString(),
      categories: []
    };

    // Define section boundaries by searching for markers
    const sectionMarkers = [
      { id: 'original_ja', startMarker: '和文\n\n(1)', endMarkers: ['英文\n\n(1)', '英文\n(1)'] },
      { id: 'original_en', startMarker: '英文\n\n(1)', endMarkers: ['国際会議講演論文'] },
      { id: 'conference', startMarker: '国際会議講演論文 (査読付)', endMarkers: ['解説論文，総合報告等'] },
      { id: 'review', startMarker: '解説論文，総合報告等 (Review)', endMarkers: ['著書・編書'] },
      { id: 'book', startMarker: '著書・編書 (Book', endMarkers: ['口頭発表 (Oral'] },
      { id: 'oral', startMarker: '口頭発表 (Oral', endMarkers: ['国際学会講習会・セミナー等'] },
      { id: 'seminars', startMarker: '国際学会講習会・セミナー等', endMarkers: ['学会発表\n\n(1)', '学会発表\n(1)'] },
      { id: 'domestic', startMarker: '学会発表\n\n(1)', endMarkers: ['ナビゲーション'] }
    ];

    // Helper to find position
    const findPos = (markers: string[]): number => {
      for (const m of markers) {
        const pos = fullText.indexOf(m);
        if (pos !== -1) return pos;
      }
      return -1;
    };

    // Extract each section
    for (const section of sectionMarkers) {
      const startPos = fullText.indexOf(section.startMarker);
      if (startPos === -1) continue;

      let endPos = fullText.length;
      for (const endMarker of section.endMarkers) {
        const pos = fullText.indexOf(endMarker);
        if (pos !== -1 && pos > startPos) {
          endPos = Math.min(endPos, pos);
        }
      }

      const sectionText = fullText.substring(startPos, endPos);

      // Parse individual items - split by numbered entries
      const items: string[] = [];
      const itemMatches = sectionText.split(/\n\((\d+)\)\s*/);

      for (let i = 1; i < itemMatches.length; i += 2) {
        const num = itemMatches[i];
        const content = itemMatches[i + 1]?.trim();
        if (content) {
          items.push(`(${num}) ${content}`);
        }
      }

      result.categories.push({
        id: section.id,
        title: section.startMarker.split('\n')[0],
        itemCount: items.length,
        items: items
      });
    }

    // Also save full text for reference
    result.fullText = fullText;

    return result;
  });

  // Parse publications into structured format
  const parsed = parsePublications(data);
  data.parsed = parsed;

  saveJson('publications.json', data);
}

// Parse publication strings into structured objects
function parsePublications(data: any) {
  const parsed: any = {
    original_ja: [],
    original_en: [],
    conference: [],
    review: [],
    book: [],
    oral: [],
    seminars: [],
    domestic: []
  };

  for (const category of data.categories) {
    const categoryId = category.id;
    if (!parsed[categoryId]) continue;

    for (const item of category.items) {
      const pub = parsePublicationString(item, categoryId);
      parsed[categoryId].push(pub);
    }
  }

  return parsed;
}

// Parse a single publication string
function parsePublicationString(text: string, type: string) {
  const pub: any = {
    raw: text,
    type: type
  };

  // Extract number
  const numMatch = text.match(/^\((\d+)\)/);
  if (numMatch) {
    pub.number = parseInt(numMatch[1]);
  }

  // Extract DOI
  const doiMatch = text.match(/doi[:\s]*([^\s\)]+)/i);
  if (doiMatch) {
    pub.doi = doiMatch[1].replace(/[)\].,]+$/, '');
  }

  // Extract year - look for 4-digit year
  const yearMatch = text.match(/[,\s](\d{4})[\s,\(\)]/);
  if (yearMatch) {
    pub.year = parseInt(yearMatch[1]);
  }

  // Extract URL if present
  const urlMatch = text.match(/(https?:\/\/[^\s\)]+)/);
  if (urlMatch) {
    pub.url = urlMatch[1];
  }

  // For English publications, try to extract authors and title
  if (type === 'original_en' || type === 'conference') {
    // Pattern: Authors: "Title." Journal...
    const titleMatch = text.match(/:\s*[""]([^""]+)[""]/);
    if (titleMatch) {
      pub.title = titleMatch[1];
    }

    // Authors are before the colon
    const authorsMatch = text.match(/^\(\d+\)\s*([^:]+):/);
    if (authorsMatch) {
      pub.authors = authorsMatch[1].split(/,\s*and\s*|,\s*/).map((a: string) => a.trim()).filter((a: string) => a);
    }
  }

  // For Japanese publications, try to extract title in 「」
  if (type === 'original_ja' || type === 'review') {
    const jaTitleMatch = text.match(/[「『]([^」』]+)[」』]/);
    if (jaTitleMatch) {
      pub.title = jaTitleMatch[1];
    }
  }

  return pub;
}

// ============================================
// RESEARCH PAGE SCRAPER
// ============================================
async function scrapeResearch(page: Page) {
  console.log('Scraping research page...');
  await page.goto(BASE_URL + '/research.html', { waitUntil: 'networkidle0', timeout: 60000 });

  const data = await page.evaluate(() => {
    const result: any = {
      title: document.title,
      groups: [],
      images: [],
      fullText: document.body.innerText
    };

    // Get images
    document.querySelectorAll('img').forEach(img => {
      result.images.push({
        src: img.src,
        alt: img.alt || ''
      });
    });

    // Get content by headers
    const headers = document.querySelectorAll('h3, h4, h5');
    headers.forEach(header => {
      const group: any = {
        title: header.textContent?.trim() || '',
        content: []
      };

      let el = header.nextElementSibling;
      while (el && !['H3', 'H4', 'H5'].includes(el.tagName)) {
        if (el.textContent?.trim()) {
          group.content.push(el.textContent.trim());
        }
        el = el.nextElementSibling;
      }

      if (group.title) {
        result.groups.push(group);
      }
    });

    return result;
  });

  saveJson('research.json', data);
}

// ============================================
// OTHERS PAGE SCRAPER (books, media, etc)
// ============================================
async function scrapeOthers(page: Page) {
  console.log('Scraping others page...');
  await page.goto(BASE_URL + '/others.html', { waitUntil: 'networkidle0', timeout: 60000 });

  const data = await page.evaluate(() => {
    const result: any = {
      title: document.title,
      sections: [],
      books: [],
      images: [],
      links: [],
      fullText: document.body.innerText
    };

    // Get images
    document.querySelectorAll('img').forEach(img => {
      result.images.push({
        src: img.src,
        alt: img.alt || ''
      });
    });

    // Get links
    document.querySelectorAll('a[href]').forEach(a => {
      result.links.push({
        href: a.getAttribute('href'),
        text: a.textContent?.trim() || ''
      });
    });

    // Get content by headers
    const headers = document.querySelectorAll('h3, h4, h5');
    headers.forEach(header => {
      const section: any = {
        title: header.textContent?.trim() || '',
        content: []
      };

      let el = header.nextElementSibling;
      while (el && !['H3', 'H4', 'H5'].includes(el.tagName)) {
        if (el.textContent?.trim()) {
          section.content.push(el.textContent.trim());
        }
        el = el.nextElementSibling;
      }

      if (section.title) {
        result.sections.push(section);
      }
    });

    return result;
  });

  saveJson('others.json', data);
}

// ============================================
// LECTURES PAGE SCRAPER
// ============================================
async function scrapeLectures(page: Page) {
  console.log('Scraping lectures page...');
  await page.goto(BASE_URL + '/lecture.html', { waitUntil: 'networkidle0', timeout: 60000 });

  const data = await page.evaluate(() => {
    const result: any = {
      title: document.title,
      courses: [],
      fullText: document.body.innerText
    };

    // Get content by headers
    const headers = document.querySelectorAll('h3, h4, h5');
    headers.forEach(header => {
      const course: any = {
        title: header.textContent?.trim() || '',
        content: []
      };

      let el = header.nextElementSibling;
      while (el && !['H3', 'H4', 'H5'].includes(el.tagName)) {
        if (el.textContent?.trim()) {
          course.content.push(el.textContent.trim());
        }
        el = el.nextElementSibling;
      }

      if (course.title) {
        result.courses.push(course);
      }
    });

    return result;
  });

  saveJson('lectures.json', data);
}

// ============================================
// PROFILE PAGE SCRAPER
// ============================================
async function scrapeProfile(page: Page) {
  console.log('Scraping profile page...');
  await page.goto(BASE_URL + '/profile.html', { waitUntil: 'networkidle0', timeout: 60000 });

  const data = await page.evaluate(() => {
    const result: any = {
      title: document.title,
      members: [],
      sections: [],
      fullText: document.body.innerText
    };

    // Get content by headers - members are often listed under role headers
    const headers = document.querySelectorAll('h3, h4, h5');
    headers.forEach(header => {
      const section: any = {
        role: header.textContent?.trim() || '',
        content: [],
        people: []
      };

      let el = header.nextElementSibling;
      while (el && !['H3', 'H4', 'H5'].includes(el.tagName)) {
        const text = el.textContent?.trim();
        if (text) {
          section.content.push(text);

          // Try to extract email addresses
          const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[a-z]+/gi);
          if (emailMatch) {
            section.people.push({
              text: text,
              emails: emailMatch
            });
          }
        }
        el = el.nextElementSibling;
      }

      if (section.role) {
        result.sections.push(section);
      }
    });

    return result;
  });

  saveJson('profile.json', data);
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('=== Starting full site scrape ===\n');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set longer timeout and viewport
  page.setDefaultTimeout(60000);
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await scrapeIndex(page);
    await scrapeIndexEn(page);
    await scrapePublications(page);
    await scrapeResearch(page);
    await scrapeOthers(page);
    await scrapeLectures(page);
    await scrapeProfile(page);

    console.log('\n=== Scrape complete ===');
    console.log(`\nAll files saved to: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('Error during scrape:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
