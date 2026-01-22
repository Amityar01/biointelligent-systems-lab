/**
 * Download Archive PDFs - Lecture materials, presentations, etc.
 */
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVES_DIR = path.join(__dirname, '../public/uploads/scraped/archives');

if (!fs.existsSync(ARCHIVES_DIR)) fs.mkdirSync(ARCHIVES_DIR, { recursive: true });

function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('Archive PDF Downloader');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Collect all archive links from lectures page
  console.log('\nScanning lecture.html for archive links...');
  await page.goto('https://www.ne.t.u-tokyo.ac.jp/lecture.html', { waitUntil: 'networkidle2' });

  const lectureLinks = await page.evaluate(() => {
    const links: string[] = [];
    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && (href.includes('archive/') || href.endsWith('.pdf') || href.endsWith('.docx'))) {
        links.push(href);
      }
    });
    return links;
  });

  // Collect from others page
  console.log('Scanning others.html for archive links...');
  await page.goto('https://www.ne.t.u-tokyo.ac.jp/others.html', { waitUntil: 'networkidle2' });

  const othersLinks = await page.evaluate(() => {
    const links: string[] = [];
    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && (href.includes('archive/') || href.endsWith('.pdf') || href.endsWith('.docx'))) {
        links.push(href);
      }
    });
    return links;
  });

  await browser.close();

  // Combine and dedupe
  const allLinks = [...new Set([...lectureLinks, ...othersLinks])];
  console.log(`\nFound ${allLinks.length} archive files to download`);

  // Download each file
  const baseUrl = 'https://www.ne.t.u-tokyo.ac.jp/';
  const downloaded: string[] = [];
  const failed: string[] = [];

  for (const link of allLinks) {
    const url = link.startsWith('http') ? link : baseUrl + link;
    const filename = path.basename(link).replace(/[%\s]/g, '-');
    const filepath = path.join(ARCHIVES_DIR, filename);

    try {
      if (fs.existsSync(filepath)) {
        console.log(`  ○ ${filename} (exists)`);
        downloaded.push(filename);
        continue;
      }

      await downloadFile(url, filepath);
      console.log(`  ✓ ${filename}`);
      downloaded.push(filename);
    } catch (err) {
      console.log(`  ✗ ${filename} - ${(err as Error).message}`);
      failed.push(filename);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Downloaded: ${downloaded.length}`);
  console.log(`Failed: ${failed.length}`);

  // Save manifest
  fs.writeFileSync(
    path.join(ARCHIVES_DIR, 'manifest.json'),
    JSON.stringify({ downloaded, failed, scrapedAt: new Date().toISOString() }, null, 2)
  );
}

main().catch(console.error);
