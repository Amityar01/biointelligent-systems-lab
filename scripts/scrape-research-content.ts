/**
 * Research Content Scraper - Downloads images and saves all research page content
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

const CONTENT_DIR = path.join(__dirname, '../content');
const IMAGES_DIR = path.join(__dirname, '../public/uploads/scraped/research');
const SCRAPED_DIR = path.join(__dirname, '../scraped');

// Ensure directories exist
[IMAGES_DIR, path.join(CONTENT_DIR, 'research')].forEach(dir => {
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
  console.log('Research Content Scraper');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log('\nNavigating to research.html...');
  await page.goto('https://www.ne.t.u-tokyo.ac.jp/research.html', { waitUntil: 'networkidle2' });

  // Extract all data
  const data = await page.evaluate(() => {
    const result: any = {
      researchGroups: [],
      images: [],
      dissertations: { bachelor: [], master: [], phd: [] },
      jspsFellows: [],
      collaborators: []
    };

    // Get all images (excluding tiny icons)
    document.querySelectorAll('img').forEach(img => {
      if (img.src && !img.src.includes('data:') && img.naturalWidth > 100) {
        result.images.push({
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }
    });

    // Extract research groups
    const groupNames = ['in vitroグループ', 'in vivoグループ', 'humanグループ'];
    const h3s = document.querySelectorAll('h3');

    h3s.forEach(h3 => {
      const title = (h3 as HTMLElement).innerText.trim();
      if (groupNames.some(g => title.includes(g))) {
        let content = '';
        let el = h3.nextElementSibling;
        while (el && el.tagName !== 'H3') {
          if (el.tagName === 'P' || el.tagName === 'DIV') {
            content += (el as HTMLElement).innerText + '\n';
          }
          el = el.nextElementSibling;
        }
        result.researchGroups.push({
          name: title,
          description: content.trim().split('\n')[0] // First paragraph
        });
      }
    });

    // Extract JSPS fellows from table
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      const text = (table as HTMLElement).innerText;
      if (text.includes('DC1') || text.includes('PD') || text.includes('JSPS')) {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            result.jspsFellows.push({
              type: (cells[0] as HTMLElement).innerText.trim(),
              period: (cells[1] as HTMLElement).innerText.trim(),
              name: (cells[2] as HTMLElement).innerText.trim(),
              topic: (cells[3] as HTMLElement).innerText.trim()
            });
          }
        });
      }
    });

    return result;
  });

  console.log(`\nFound ${data.images.length} images`);
  console.log(`Found ${data.researchGroups.length} research groups`);
  console.log(`Found ${data.jspsFellows.length} JSPS fellows`);

  // Download images
  console.log('\nDownloading images...');
  const imageMap: Record<string, string> = {};

  for (let i = 0; i < data.images.length; i++) {
    const img = data.images[i];
    const url = img.src;
    const filename = `research-${i + 1}-${path.basename(url).replace(/[%\s]/g, '-')}`;
    const filepath = path.join(IMAGES_DIR, filename);

    try {
      if (!fs.existsSync(filepath)) {
        await downloadImage(url, filepath);
        console.log(`  Downloaded: ${filename}`);
      } else {
        console.log(`  Exists: ${filename}`);
      }
      imageMap[url] = `/uploads/scraped/research/${filename}`;
    } catch (err) {
      console.log(`  Failed: ${filename} - ${(err as Error).message}`);
    }
  }

  // Save research groups
  console.log('\nSaving research groups...');
  const groupsData = {
    groups: [
      {
        id: 'in-vitro',
        name: { en: 'In Vitro Group', ja: 'in vitroグループ' },
        description: {
          en: 'Research on dissociated neuronal cultures. When neurons are seeded on a dish, spontaneous neural activity begins and self-organizing neural circuits form. We observe this in detail on high-density CMOS arrays and study the circuit formation and plasticity of neural cell populations. Based on these experiments, we aim to develop emergent computers that can realize brain-like computational functions.',
          ja: '神経細胞の分散培養系を主な研究対象としています．シャーレ上に神経細胞を播種すると，自発的に神経活動が始まり，自己組織的に神経回路が形成されます．さらに，神経回路は，外部からの刺激に対しても柔軟に変化します．この様子を高密度CMOSアレイの上で詳細に観察し，神経細胞集団の回路形成と可塑性を考察します．これらの実験データに基づいて，脳のような計算機能を実現できる創発コンピュータの開発を目指しています．'
        },
        focus: ['Dissociated neuronal cultures', 'CMOS electrode arrays', 'Reservoir computing', 'Emergent computation'],
        equipment: ['Clean booth for cell culture', 'CMOS arrays with 1000+ measurement points'],
        collaborators: [
          { name: 'ETH Zurich BEL Lab', url: 'http://www.bsse.ethz.ch/bel/' },
          { name: 'MaxWell Biosystems', url: 'https://www.mxwbio.com/' },
          { name: 'Kohei Nakajima Lab', url: 'https://www.kohei-nakajima.com/' }
        ]
      },
      {
        id: 'in-vivo',
        name: { en: 'In Vivo Group', ja: 'in vivoグループ' },
        description: {
          en: 'Research on the rat auditory system. We develop techniques to decode information from neural activity patterns obtained with microelectrode arrays using information theory and machine learning. Through behavioral experiments, we study how subjective information such as perception, texture, emotion, and preference is represented in neural activity patterns. In collaboration with clinical research, we have explored brain mechanisms and treatments for tinnitus and hyperacusis. Recent research has shown that rats respond to music, exploring the origins of music and mechanisms of music perception from a neuroscience perspective.',
          ja: 'ラットの聴覚系を主な研究対象としています．情報理論や機械学習を駆使して，微小電極アレイで得た神経活動パターンから情報を読み出す技術を開発しています．また，行動実験を駆使して，知覚，質感，情動，嗜好など，主観的な情報が，どのように神経活動パターンに表現されているかを考察します．臨床研究と連携しながら，耳鳴や聴覚過敏の脳内メカニズムと治療方法を探求してきました．最近の研究では，ラットも音楽に反応することを見出し，音楽の起源や音楽知覚のメカニズムを脳科学的に探求しています．'
        },
        focus: ['Rat auditory cortex', 'Information decoding', 'Music and the brain', 'Tinnitus research'],
        equipment: ['4 soundproof rooms', '5 soundproof boxes'],
        collaborators: [
          { name: 'NTT Communication Science Labs', url: 'http://www.brl.ntt.co.jp/cs/per/index-j.html' },
          { name: 'Kyoto University Vision Lab', url: 'https://vision.ist.i.kyoto-u.ac.jp/' }
        ]
      },
      {
        id: 'human',
        name: { en: 'Human Group', ja: 'humanグループ' },
        description: {
          en: 'Research on the human brain. We develop brain-machine interfaces and conduct cognitive science research using EEG and MRI. In collaboration with the neurosurgery department at Jichi Medical University, we research epilepsy diagnosis and treatment methods. During epileptic seizures, collective neural activity becomes completely uncontrolled. By understanding why seizures occur and how they can be prevented, we study the principles of coordinated collective activity of neurons.',
          ja: 'ヒトの脳を研究対象としています．脳波やMRIを利用して，ブレイン-マシン・インターフェースの開発や認知科学の研究を進めています．また，自治医大の脳神経外科と共同で，てんかん発作の診断や治療方法の研究を進めています．てんかん発作では，神経細胞の集団活動が全く制御できない状態にあります．どうして発作に陥るのか，また，どうすれば，発作を回避できるのかを明らかにすることで，神経細胞の協調的な集団活動の原理を考察します．'
        },
        focus: ['Brain-machine interfaces', 'Epilepsy diagnosis', 'EEG/MRI studies', 'Vagus nerve stimulation'],
        equipment: ['EEG soundproof room', 'MRI access at university facilities'],
        collaborators: [
          { name: 'Prof. Kensuke Kawai (Jichi Medical University)', url: 'http://www.jichi.ac.jp/brain/aboutUs/index.html' },
          { name: 'Assoc. Prof. Naoto Kunii (Jichi Medical University)' },
          { name: 'Dr. Yoshiyuki Onuki (Jichi Medical University)' }
        ]
      }
    ]
  };

  fs.writeFileSync(
    path.join(CONTENT_DIR, 'research/groups.yaml'),
    yaml.dump(groupsData, { lineWidth: -1 }),
    'utf-8'
  );
  console.log('  Created: research/groups.yaml');

  // Save JSPS fellows
  if (data.jspsFellows.length > 0) {
    fs.writeFileSync(
      path.join(CONTENT_DIR, 'research/jsps-fellows.yaml'),
      yaml.dump({ fellows: data.jspsFellows }, { lineWidth: -1 }),
      'utf-8'
    );
    console.log('  Created: research/jsps-fellows.yaml');
  }

  // Save image mapping
  fs.writeFileSync(
    path.join(SCRAPED_DIR, 'research-images.json'),
    JSON.stringify({ images: data.images, mapping: imageMap }, null, 2),
    'utf-8'
  );
  console.log('  Created: research-images.json');

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('Research content scraping complete');
  console.log(`  - Images downloaded: ${Object.keys(imageMap).length}`);
  console.log(`  - Research groups: 3`);
  console.log(`  - JSPS fellows: ${data.jspsFellows.length}`);
}

main().catch(console.error);
