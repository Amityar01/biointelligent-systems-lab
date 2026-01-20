/**
 * Import Scraped Lab Content to CMS
 *
 * This script reads scraped JSON data and converts it to CMS YAML/MD format
 * Run with: npx ts-node scripts/import-scraped-to-cms.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRAPED_DIR = path.join(__dirname, '..', 'scraped');
const CONTENT_DIR = path.join(__dirname, '..', 'content');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'scraped');

// Ensure directories exist
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Download image from URL
async function downloadImage(url: string, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const filepath = path.join(UPLOADS_DIR, filename);

    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`  Skipping (exists): ${filename}`);
      resolve(`/uploads/scraped/${filename}`);
      return;
    }

    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          https.get(redirectUrl, (res) => {
            res.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(`  Downloaded: ${filename}`);
              resolve(`/uploads/scraped/${filename}`);
            });
          }).on('error', reject);
        }
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`  Downloaded: ${filename}`);
          resolve(`/uploads/scraped/${filename}`);
        });
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      console.log(`  Failed: ${filename} - ${err.message}`);
      resolve(''); // Return empty on failure
    });
  });
}

// Convert to slug format
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Generate YAML content for a member
function generateMemberYaml(member: {
  id: string;
  slug: string;
  name_en: string;
  name_ja: string;
  role_en: string;
  role_ja: string;
  email?: string;
  bio_en?: string;
  bio_ja?: string;
  image?: string;
}): string {
  const yaml = `id: ${member.id}
slug: ${member.slug}
name:
  en: "${member.name_en}"
  ja: "${member.name_ja}"
role:
  en: "${member.role_en}"
  ja: "${member.role_ja}"
bio:
  en: "${member.bio_en || '[EN: Biography to be added]'}"
  ja: "${member.bio_ja || '経歴は後ほど追加されます'}"
${member.email ? `email: ${member.email}` : ''}
${member.image ? `image: ${member.image}` : ''}
`;
  return yaml;
}

// Generate homepage settings YAML
function generateHomepageSettingsYaml(images: { hero: string; research: { [key: string]: string } }): string {
  return `# Homepage Settings
# Managed by Decap CMS

hero_image: "${images.hero}"

research_images:
  cultures:
    main: "/uploads/scraped/neuronal-culture.jpg"
    secondary: "/uploads/scraped/cmos-array.jpg"
  auditory:
    main: "/uploads/scraped/lab-visualization.jpg"
    secondary: "/uploads/scraped/waveform.jpg"
  clinical:
    main: "/uploads/scraped/ecog-electrode.jpg"
    secondary: "/uploads/scraped/microelectrode-arrays.jpg"

lab_images:
  hero_banner: "${images.hero}"
  lab_photo: "/uploads/scraped/lab-photo.jpg"

books:
  life_intelligence: "/uploads/scraped/life-intelligence-book.jpg"
  brain_for_engineers_1: "/uploads/scraped/brain-engineers-1.jpg"
  brain_for_engineers_2: "/uploads/scraped/brain-engineers-2.jpg"
`;
}

async function main() {
  console.log('=== Lab Content Import Script ===\n');

  // Ensure directories
  ensureDir(UPLOADS_DIR);
  ensureDir(path.join(CONTENT_DIR, 'settings'));

  // Read scraped data
  console.log('Reading scraped data...');

  const mainSiteData = JSON.parse(
    fs.readFileSync(path.join(SCRAPED_DIR, 'main-site-data.json'), 'utf-8')
  );

  const deptSiteData = JSON.parse(
    fs.readFileSync(path.join(SCRAPED_DIR, 'department-site-data.json'), 'utf-8')
  );

  // Download images
  console.log('\nDownloading images...');

  const imageDownloads: { url: string; filename: string }[] = [
    // Hero images
    { url: 'https://www.kikaib.t.u-tokyo.ac.jp/wp-content/uploads/2024/03/simei_chino_topimg-scaled.jpg', filename: 'hero-banner.jpg' },
    { url: 'https://www.kikaib.t.u-tokyo.ac.jp/wp-content/uploads/2024/03/m_seimei_chino_tpimg.jpg', filename: 'hero-banner-mobile.jpg' },

    // Faculty photos
    { url: 'https://www.kikaib.t.u-tokyo.ac.jp/wp-content/uploads/elementor/thumbs/seimei_takahashi_t-qkjq5n5l2xpr4rmajni215jz7tvzbkr4ffnd7lr8sw.jpg', filename: 'takahashi.jpg' },
    { url: 'https://www.kikaib.t.u-tokyo.ac.jp/wp-content/uploads/elementor/thumbs/seimei_shiramatsu_t-qkjq5m7qw3ogt5nnp53fgnsimg0m3vne3azvqbsmz4.jpg', filename: 'shiramatsu.jpg' },

    // Research images
    { url: 'https://www.ne.t.u-tokyo.ac.jp/eng12.jpg', filename: 'lab-visualization.jpg' },
    { url: 'https://www.ne.t.u-tokyo.ac.jp/image1.jpg', filename: 'neuronal-culture.jpg' },
    { url: 'https://www.ne.t.u-tokyo.ac.jp/image.jpg', filename: 'cmos-array.jpg' },
    { url: 'https://www.ne.t.u-tokyo.ac.jp/image4.jpg', filename: 'microelectrode-arrays.jpg' },
    { url: 'https://www.ne.t.u-tokyo.ac.jp/image31.jpg', filename: 'ecog-electrode.jpg' },
    { url: 'https://www.ne.t.u-tokyo.ac.jp/research6.png', filename: 'research-diagram.png' },
    { url: 'https://www.ne.t.u-tokyo.ac.jp/fig92.png', filename: 'fig-diagram.png' },
    { url: 'https://www.ne.t.u-tokyo.ac.jp/maxlab1.png', filename: 'maxlab.png' },
    { url: 'https://www.ne.t.u-tokyo.ac.jp/_DSF69951.jpg', filename: 'lab-photo.jpg' },

    // Book covers
    { url: 'https://www.ne.t.u-tokyo.ac.jp/image3.jpg', filename: 'life-intelligence-book.jpg' },
    { url: 'https://www.ne.t.u-tokyo.ac.jp/51prEWgW7AL1._SX353_BO1,204,203,200_[1].jpg', filename: 'brain-engineers-1.jpg' },
    { url: 'https://www.ne.t.u-tokyo.ac.jp/61Ghjgu90YL._SX352_BO1,204,203,200_[1].jpg', filename: 'brain-engineers-2.jpg' },
  ];

  for (const img of imageDownloads) {
    await downloadImage(img.url, img.filename);
  }

  // Create homepage settings file
  console.log('\nCreating homepage settings...');
  const homepageSettings = generateHomepageSettingsYaml({
    hero: '/uploads/scraped/hero-banner.jpg',
    research: {}
  });

  fs.writeFileSync(
    path.join(CONTENT_DIR, 'settings', 'homepage.yaml'),
    homepageSettings
  );
  console.log('  Created: content/settings/homepage.yaml');

  // Note: Members are already migrated, so we skip that
  // But we can verify/update with scraped data if needed

  console.log('\n=== Import Complete ===');
  console.log(`\nImages saved to: public/uploads/scraped/`);
  console.log(`Settings saved to: content/settings/homepage.yaml`);
  console.log('\nNext steps:');
  console.log('1. Update public/config.yml to add settings collection');
  console.log('2. Update src/lib/content.ts to read homepage settings');
  console.log('3. Update src/app/page.tsx to use CMS settings');
}

main().catch(console.error);
