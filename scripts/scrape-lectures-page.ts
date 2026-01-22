/**
 * Lectures Page Scraper - Extracts all lecture/course data
 */
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRAPED_DIR = path.join(__dirname, '../scraped');
const CONTENT_DIR = path.join(__dirname, '../content');

// Ensure directories exist
[SCRAPED_DIR, path.join(CONTENT_DIR, 'lectures')].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function main() {
  console.log('='.repeat(60));
  console.log('Lectures Page Scraper');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('\nNavigating to lecture.html...');
  await page.goto('https://www.ne.t.u-tokyo.ac.jp/lecture.html', { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    const result: any = {
      courses: [],
      rawSections: []
    };

    // Get all h2/h3/h4 headers and their content
    const headings = document.querySelectorAll('h2, h3, h4');
    headings.forEach(heading => {
      const title = (heading as HTMLElement).innerText.trim();
      let content = '';
      let el = heading.nextElementSibling;
      while (el && !['H2', 'H3', 'H4'].includes(el.tagName)) {
        content += (el as HTMLElement).innerText + '\n';
        el = el.nextElementSibling;
      }
      if (title || content.trim()) {
        result.rawSections.push({
          level: heading.tagName.toLowerCase(),
          title,
          content: content.trim()
        });
      }
    });

    // Try to extract structured course data
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          result.courses.push({
            cells: Array.from(cells).map(c => (c as HTMLElement).innerText.trim())
          });
        }
      });
    });

    // Get all paragraphs
    const paragraphs: string[] = [];
    document.querySelectorAll('p').forEach(p => {
      const text = (p as HTMLElement).innerText.trim();
      if (text.length > 10) paragraphs.push(text);
    });
    result.paragraphs = paragraphs;

    // Get all list items
    const listItems: string[] = [];
    document.querySelectorAll('li').forEach(li => {
      const text = (li as HTMLElement).innerText.trim();
      if (text.length > 5) listItems.push(text);
    });
    result.listItems = listItems;

    // Get all links
    const links: { text: string; href: string }[] = [];
    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href');
      const text = (a as HTMLElement).innerText.trim();
      if (href && text) links.push({ text, href });
    });
    result.links = links;

    return result;
  });

  console.log(`\nExtracted:`);
  console.log(`  - ${data.rawSections.length} sections`);
  console.log(`  - ${data.courses.length} table rows`);
  console.log(`  - ${data.paragraphs.length} paragraphs`);
  console.log(`  - ${data.listItems.length} list items`);

  // Save raw data
  fs.writeFileSync(
    path.join(SCRAPED_DIR, 'lectures-page.json'),
    JSON.stringify({
      scrapedAt: new Date().toISOString(),
      url: 'https://www.ne.t.u-tokyo.ac.jp/lecture.html',
      ...data
    }, null, 2),
    'utf-8'
  );
  console.log('\n  Created: lectures-page.json');

  // Create structured lectures YAML
  const lecturesYaml: any = {
    courses: []
  };

  // Parse courses from sections
  let currentYear = null;
  let currentSemester = null;

  for (const section of data.rawSections) {
    // Check if this is a year header
    const yearMatch = section.title.match(/(\d{4})年度?/);
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1]);
    }

    // Check for semester
    if (section.title.includes('春') || section.title.includes('前期') || section.title.includes('S')) {
      currentSemester = 'spring';
    } else if (section.title.includes('秋') || section.title.includes('後期') || section.title.includes('A')) {
      currentSemester = 'fall';
    }

    // Extract course names from content
    const lines = section.content.split('\n').filter((l: string) => l.trim());
    for (const line of lines) {
      if (line.length > 5 && !line.includes('http')) {
        lecturesYaml.courses.push({
          name: line.trim(),
          year: currentYear,
          semester: currentSemester
        });
      }
    }
  }

  fs.writeFileSync(
    path.join(CONTENT_DIR, 'lectures/courses.yaml'),
    yaml.dump(lecturesYaml, { lineWidth: -1 }),
    'utf-8'
  );
  console.log('  Created: lectures/courses.yaml');

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('Lectures scraping complete');
}

main().catch(console.error);
