/**
 * Others Page Scraper - Extracts books, media, serializations
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

const IMAGES_DIR = path.join(__dirname, '../public/uploads/scraped/books');
const SCRAPED_DIR = path.join(__dirname, '../scraped');
const CONTENT_DIR = path.join(__dirname, '../content');

// Ensure directories exist
[IMAGES_DIR, SCRAPED_DIR, path.join(CONTENT_DIR, 'media/books')].forEach(dir => {
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
  console.log('Others Page Scraper');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('\nNavigating to others.html...');
  await page.goto('https://www.ne.t.u-tokyo.ac.jp/others.html', { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    const result: any = {
      books: [],
      serializations: [],
      media: [],
      rawSections: [],
      images: []
    };

    // Get all images
    document.querySelectorAll('img').forEach(img => {
      if (img.src && !img.src.includes('data:') && img.naturalWidth > 50) {
        result.images.push({
          src: img.src,
          alt: img.alt || ''
        });
      }
    });

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

    // Get all paragraphs
    const paragraphs: string[] = [];
    document.querySelectorAll('p').forEach(p => {
      const text = (p as HTMLElement).innerText.trim();
      if (text.length > 10) paragraphs.push(text);
    });
    result.paragraphs = paragraphs;

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
  console.log(`  - ${data.paragraphs.length} paragraphs`);
  console.log(`  - ${data.images.length} images`);

  // Download book images
  console.log('\nDownloading images...');
  const imageMap: Record<string, string> = {};

  for (let i = 0; i < data.images.length; i++) {
    const img = data.images[i];
    const url = img.src;
    const ext = path.extname(url).split('?')[0] || '.jpg';
    const filename = `book-${i + 1}${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);

    try {
      if (!fs.existsSync(filepath)) {
        await downloadImage(url, filepath);
        console.log(`  ✓ ${filename}`);
      } else {
        console.log(`  ○ ${filename} (exists)`);
      }
      imageMap[url] = `/uploads/scraped/books/${filename}`;
    } catch (err) {
      console.log(`  ✗ ${filename} - ${(err as Error).message}`);
    }
  }

  // Save raw data
  fs.writeFileSync(
    path.join(SCRAPED_DIR, 'others-page.json'),
    JSON.stringify({
      scrapedAt: new Date().toISOString(),
      url: 'https://www.ne.t.u-tokyo.ac.jp/others.html',
      imageMapping: imageMap,
      ...data
    }, null, 2),
    'utf-8'
  );
  console.log('\n  Created: others-page.json');

  // Create books YAML (the 3 known books)
  const books = [
    {
      id: 'life-intelligence',
      title: {
        ja: '生命知能と人工知能 AI時代の脳の使い方・育て方',
        en: 'Life Intelligence and Artificial Intelligence'
      },
      author: '高橋宏知',
      publisher: '講談社',
      year: 2022,
      isbn: '',
      amazon: 'https://www.amazon.co.jp/dp/B09P88FBLQ',
      image: '/uploads/scraped/main/main-2-61Ghjgu90YL._SX352_BO1,204,203,200_-1-.jpg',
      description: {
        ja: 'AI時代における脳の使い方と育て方について、工学的な視点から解説。',
        en: 'An engineering perspective on how to use and develop the brain in the AI era.'
      }
    },
    {
      id: 'brain-engineers-1',
      title: {
        ja: 'メカ屋のための脳科学入門 脳をリバースエンジニアリングする',
        en: 'Brain Science for Engineers: Reverse Engineering the Brain'
      },
      author: '高橋宏知',
      publisher: '日刊工業新聞社',
      year: 2016,
      isbn: '978-4526076053',
      amazon: 'https://www.amazon.co.jp/dp/4526076058',
      image: '/uploads/scraped/main/main-3-51prEWgW7AL1._SX353_BO1,204,203,200_-1-.jpg',
      description: {
        ja: '機械工学者のための脳科学入門書。脳をリバースエンジニアリングの視点で解説。',
        en: 'An introduction to brain science for mechanical engineers, explaining the brain from a reverse engineering perspective.'
      }
    },
    {
      id: 'brain-engineers-2',
      title: {
        ja: '続 メカ屋のための脳科学入門 記憶・学習/意識編',
        en: 'Brain Science for Engineers Vol. 2: Memory, Learning, and Consciousness'
      },
      author: '高橋宏知',
      publisher: '日刊工業新聞社',
      year: 2017,
      isbn: '978-4526077715',
      amazon: 'https://www.amazon.co.jp/dp/4526077712',
      image: '/uploads/scraped/books/brain-engineers-2.jpg',
      description: {
        ja: 'メカ屋のための脳科学入門の続編。記憶、学習、意識について解説。',
        en: 'Sequel to Brain Science for Engineers, covering memory, learning, and consciousness.'
      }
    }
  ];

  for (const book of books) {
    fs.writeFileSync(
      path.join(CONTENT_DIR, `media/books/${book.id}.yaml`),
      yaml.dump(book, { lineWidth: -1 }),
      'utf-8'
    );
    console.log(`  Created: media/books/${book.id}.yaml`);
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('Others page scraping complete');
  console.log(`  - Images: ${Object.keys(imageMap).length}`);
  console.log(`  - Books: ${books.length}`);
}

main().catch(console.error);
