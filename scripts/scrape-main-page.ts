/**
 * Main Page Scraper - Downloads images and saves all main page content
 */
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '../public/uploads/scraped/main');
const SCRAPED_DIR = path.join(__dirname, '../scraped');

// Ensure directories exist
[IMAGES_DIR, SCRAPED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
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
  console.log('Main Page Scraper');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Scrape Japanese main page
  console.log('\n1. Scraping Japanese main page...');
  await page.goto('https://www.ne.t.u-tokyo.ac.jp/index.html', { waitUntil: 'networkidle2' });

  const jaData = await page.evaluate(() => {
    const result: any = {
      images: [],
      hero: { title: '', subtitle: '', description: '' },
      books: [],
      news: [],
      research: [],
      links: []
    };

    // Get all images
    document.querySelectorAll('img').forEach(img => {
      if (img.src && !img.src.includes('data:') && img.naturalWidth > 50) {
        result.images.push({
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth,
          height: img.naturalHeight,
          className: img.className
        });
      }
    });

    // Get background images
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
        const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch && !urlMatch[1].includes('data:')) {
          result.images.push({
            src: urlMatch[1],
            alt: 'background',
            type: 'background'
          });
        }
      }
    });

    // Extract hero section
    const h1 = document.querySelector('h1');
    if (h1) result.hero.title = (h1 as HTMLElement).innerText.trim();

    // Extract all text sections
    const sections: { element: string; text: string }[] = [];
    document.querySelectorAll('h2, h3, h4, p, li').forEach(el => {
      const text = (el as HTMLElement).innerText.trim();
      if (text.length > 10) {
        sections.push({ element: el.tagName.toLowerCase(), text });
      }
    });
    result.sections = sections;

    // Extract links
    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href');
      const text = (a as HTMLElement).innerText.trim();
      if (href && text) {
        result.links.push({ href, text });
      }
    });

    return result;
  });

  console.log(`  Found ${jaData.images.length} images (JA page)`);

  // Scrape English main page
  console.log('\n2. Scraping English main page...');
  await page.goto('https://www.ne.t.u-tokyo.ac.jp/index-e.html', { waitUntil: 'networkidle2' });

  const enData = await page.evaluate(() => {
    const result: any = {
      images: [],
      hero: { title: '', subtitle: '', description: '' },
      sections: [],
      links: []
    };

    // Get all images
    document.querySelectorAll('img').forEach(img => {
      if (img.src && !img.src.includes('data:') && img.naturalWidth > 50) {
        result.images.push({
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }
    });

    // Extract hero section
    const h1 = document.querySelector('h1');
    if (h1) result.hero.title = (h1 as HTMLElement).innerText.trim();

    // Extract all text sections
    document.querySelectorAll('h2, h3, h4, p, li').forEach(el => {
      const text = (el as HTMLElement).innerText.trim();
      if (text.length > 10) {
        result.sections.push({ element: el.tagName.toLowerCase(), text });
      }
    });

    // Extract links
    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href');
      const text = (a as HTMLElement).innerText.trim();
      if (href && text) {
        result.links.push({ href, text });
      }
    });

    return result;
  });

  console.log(`  Found ${enData.images.length} images (EN page)`);

  // Combine unique images from both pages
  const allImages = new Map<string, any>();
  [...jaData.images, ...enData.images].forEach(img => {
    if (!allImages.has(img.src)) {
      allImages.set(img.src, img);
    }
  });

  console.log(`\n3. Downloading ${allImages.size} unique images...`);
  const imageMap: Record<string, string> = {};

  let i = 0;
  for (const [url, img] of allImages) {
    i++;
    // Clean filename
    let filename = path.basename(url)
      .replace(/[%\s\[\]]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure unique filename
    filename = `main-${i}-${filename}`;
    const filepath = path.join(IMAGES_DIR, filename);

    try {
      if (!fs.existsSync(filepath)) {
        await downloadImage(url, filepath);
        console.log(`  ✓ ${filename}`);
      } else {
        console.log(`  ○ ${filename} (exists)`);
      }
      imageMap[url] = `/uploads/scraped/main/${filename}`;
    } catch (err) {
      console.log(`  ✗ ${filename} - ${(err as Error).message}`);
    }
  }

  // Save scraped data
  console.log('\n4. Saving scraped content...');

  const mainPageData = {
    scrapedAt: new Date().toISOString(),
    japanese: {
      url: 'https://www.ne.t.u-tokyo.ac.jp/index.html',
      hero: jaData.hero,
      sections: jaData.sections,
      links: jaData.links
    },
    english: {
      url: 'https://www.ne.t.u-tokyo.ac.jp/index-e.html',
      hero: enData.hero,
      sections: enData.sections,
      links: enData.links
    },
    images: Array.from(allImages.values()).map(img => ({
      original: img.src,
      local: imageMap[img.src],
      alt: img.alt,
      width: img.width,
      height: img.height,
      type: img.type || 'inline'
    }))
  };

  fs.writeFileSync(
    path.join(SCRAPED_DIR, 'main-page-content.json'),
    JSON.stringify(mainPageData, null, 2),
    'utf-8'
  );
  console.log('  Created: main-page-content.json');

  // Create hero content YAML
  const heroContent = {
    hero: {
      title: {
        ja: jaData.hero.title || '高橋研究室',
        en: enData.hero.title || 'Takahashi Laboratory'
      },
      description: {
        ja: jaData.sections.find((s: any) => s.text.includes('神経工学'))?.text || '',
        en: enData.sections.find((s: any) => s.text.includes('neural'))?.text || ''
      }
    }
  };

  fs.writeFileSync(
    path.join(SCRAPED_DIR, 'hero-content.yaml'),
    yaml.dump(heroContent, { lineWidth: -1 }),
    'utf-8'
  );
  console.log('  Created: hero-content.yaml');

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('Main page scraping complete');
  console.log(`  - Images downloaded: ${Object.keys(imageMap).length}`);
  console.log(`  - JA sections: ${jaData.sections.length}`);
  console.log(`  - EN sections: ${enData.sections.length}`);
}

main().catch(console.error);
