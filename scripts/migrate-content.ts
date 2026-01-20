/**
 * Migration script to convert TypeScript data files to CMS-compatible YAML/Markdown files.
 *
 * Run with: npx tsx scripts/migrate-content.ts
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Import existing data
import { members, staff, students, undergraduates, visitors, alumni, Member } from '../src/data/members';
import { news, NewsItem } from '../src/data/news';
import { books, mediaAppearances, youtubeChannel, serializations, Book, MediaAppearance } from '../src/data/media';
import { translations } from '../src/data/translations';

const contentDir = path.join(process.cwd(), 'content');

// Ensure directories exist
function ensureDir(dir: string) {
  const fullPath = path.join(contentDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

// Convert Member to new bilingual format
function convertMember(member: Member, category: string) {
  return {
    id: member.id,
    slug: member.id,
    name: {
      en: member.name,
      ja: member.nameJa,
    },
    role: {
      en: member.role,
      ja: member.roleJa,
    },
    bio: {
      en: member.bio,
      ja: member.bioJa,
    },
    ...(member.image && { image: member.image }),
    ...(member.email && { email: member.email }),
    ...(member.links && Object.keys(member.links).length > 0 && { links: member.links }),
    ...(member.research && member.research.length > 0 && { research: member.research }),
    ...(member.education && member.education.length > 0 && { education: member.education }),
    ...(member.awards && member.awards.length > 0 && { awards: member.awards }),
  };
}

// Migrate members
function migrateMembers() {
  const categories = [
    { name: 'faculty', data: members },
    { name: 'staff', data: staff },
    { name: 'students', data: students },
    { name: 'undergraduates', data: undergraduates },
    { name: 'visitors', data: visitors },
    { name: 'alumni', data: alumni },
  ];

  for (const { name, data } of categories) {
    ensureDir(`members/${name}`);
    for (const member of data) {
      const converted = convertMember(member, name);
      const filePath = path.join(contentDir, `members/${name}/${member.id}.yaml`);
      fs.writeFileSync(filePath, yaml.dump(converted, { lineWidth: -1, noRefs: true }));
      console.log(`  Created: members/${name}/${member.id}.yaml`);
    }
  }
}

// Convert NewsItem to markdown with frontmatter
function convertNews(item: NewsItem): string {
  const frontmatter = {
    id: item.id,
    title: {
      en: item.title,
      ja: item.titleJa,
    },
    date: item.date,
    category: item.category,
    excerpt: {
      en: item.excerpt,
      ja: item.excerptJa,
    },
    ...(item.image && { image: item.image }),
    ...(item.link && { link: item.link }),
  };

  const content = item.content || item.contentJa || '';

  return `---
${yaml.dump(frontmatter, { lineWidth: -1, noRefs: true })}---

${content}`;
}

// Migrate news
function migrateNews() {
  ensureDir('news');

  for (const item of news) {
    const dateStr = item.date.replace(/-/g, '-');
    const slug = item.id.replace(/^news-/, '').replace(/[^a-z0-9-]/g, '-');
    const filename = `${dateStr}-${slug}.md`;
    const filePath = path.join(contentDir, `news/${filename}`);
    fs.writeFileSync(filePath, convertNews(item));
    console.log(`  Created: news/${filename}`);
  }
}

// Convert Book to new format
function convertBook(book: Book) {
  return {
    id: book.id,
    title: {
      en: book.title,
      ja: book.titleJa,
    },
    publisher: {
      en: book.publisher,
      ja: book.publisherJa,
    },
    year: book.year,
    description: {
      en: book.description,
      ja: book.descriptionJa,
    },
    ...(book.image && { image: book.image }),
    ...(book.amazon && { amazon: book.amazon }),
    ...(book.publisher_url && { publisher_url: book.publisher_url }),
  };
}

// Migrate books
function migrateBooks() {
  ensureDir('media/books');

  for (const book of books) {
    const converted = convertBook(book);
    const filePath = path.join(contentDir, `media/books/${book.id}.yaml`);
    fs.writeFileSync(filePath, yaml.dump(converted, { lineWidth: -1, noRefs: true }));
    console.log(`  Created: media/books/${book.id}.yaml`);
  }
}

// Convert MediaAppearance to new format
function convertMediaAppearance(appearance: MediaAppearance) {
  return {
    id: appearance.id,
    title: {
      en: appearance.title,
      ja: appearance.titleJa,
    },
    outlet: appearance.outlet,
    date: appearance.date,
    type: appearance.type,
    description: {
      en: appearance.description,
      ja: appearance.descriptionJa,
    },
    ...(appearance.link && { link: appearance.link }),
  };
}

// Migrate media appearances
function migrateMediaAppearances() {
  ensureDir('media/appearances');

  for (const appearance of mediaAppearances) {
    const converted = convertMediaAppearance(appearance);
    const filePath = path.join(contentDir, `media/appearances/${appearance.id}.yaml`);
    fs.writeFileSync(filePath, yaml.dump(converted, { lineWidth: -1, noRefs: true }));
    console.log(`  Created: media/appearances/${appearance.id}.yaml`);
  }
}

// Migrate YouTube channel
function migrateYouTube() {
  const converted = {
    name: {
      en: youtubeChannel.name,
      ja: youtubeChannel.nameJa,
    },
    url: youtubeChannel.url,
    description: {
      en: youtubeChannel.description,
      ja: youtubeChannel.descriptionJa,
    },
  };

  const filePath = path.join(contentDir, 'media/youtube.yaml');
  fs.writeFileSync(filePath, yaml.dump(converted, { lineWidth: -1, noRefs: true }));
  console.log(`  Created: media/youtube.yaml`);
}

// Migrate serializations
function migrateSerializations() {
  ensureDir('media/serializations');

  for (let i = 0; i < serializations.length; i++) {
    const serial = serializations[i];
    const id = serial.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const converted = {
      id,
      title: {
        en: serial.title,
        ja: serial.titleJa,
      },
      publication: {
        en: serial.publication,
        ja: serial.publicationJa,
      },
      period: serial.period,
      description: {
        en: serial.description,
        ja: serial.descriptionJa,
      },
    };

    const filePath = path.join(contentDir, `media/serializations/${id}.yaml`);
    fs.writeFileSync(filePath, yaml.dump(converted, { lineWidth: -1, noRefs: true }));
    console.log(`  Created: media/serializations/${id}.yaml`);
  }
}

// Convert translations to bilingual format
function migrateTranslations() {
  const converted = {
    nav: {
      home: { en: translations.en.nav.home, ja: translations.ja.nav.home },
      research: { en: translations.en.nav.research, ja: translations.ja.nav.research },
      members: { en: translations.en.nav.members, ja: translations.ja.nav.members },
      publications: { en: translations.en.nav.publications, ja: translations.ja.nav.publications },
      news: { en: translations.en.nav.news, ja: translations.ja.nav.news },
      contact: { en: translations.en.nav.contact, ja: translations.ja.nav.contact },
    },
    home: {
      tagline: { en: translations.en.home.tagline, ja: translations.ja.home.tagline },
      labName: { en: translations.en.home.labName, ja: translations.ja.home.labName },
      subtitle: { en: translations.en.home.subtitle, ja: translations.ja.home.subtitle },
      mission: { en: translations.en.home.mission, ja: translations.ja.home.mission },
      exploreResearch: { en: translations.en.home.exploreResearch, ja: translations.ja.home.exploreResearch },
      viewPublications: { en: translations.en.home.viewPublications, ja: translations.ja.home.viewPublications },
      researchAreas: { en: translations.en.home.researchAreas, ja: translations.ja.home.researchAreas },
      researchAreasDesc: { en: translations.en.home.researchAreasDesc, ja: translations.ja.home.researchAreasDesc },
      latestNews: { en: translations.en.home.latestNews, ja: translations.ja.home.latestNews },
      latestNewsDesc: { en: translations.en.home.latestNewsDesc, ja: translations.ja.home.latestNewsDesc },
      viewAllNews: { en: translations.en.home.viewAllNews, ja: translations.ja.home.viewAllNews },
      learnMore: { en: translations.en.home.learnMore, ja: translations.ja.home.learnMore },
      joinResearch: { en: translations.en.home.joinResearch, ja: translations.ja.home.joinResearch },
      joinResearchDesc: { en: translations.en.home.joinResearchDesc, ja: translations.ja.home.joinResearchDesc },
      contactUs: { en: translations.en.home.contactUs, ja: translations.ja.home.contactUs },
      meetTeam: { en: translations.en.home.meetTeam, ja: translations.ja.home.meetTeam },
    },
    research: {
      neuralComputation: { en: translations.en.research.neuralComputation, ja: translations.ja.research.neuralComputation },
      neuralComputationDesc: { en: translations.en.research.neuralComputationDesc, ja: translations.ja.research.neuralComputationDesc },
      bci: { en: translations.en.research.bci, ja: translations.ja.research.bci },
      bciDesc: { en: translations.en.research.bciDesc, ja: translations.ja.research.bciDesc },
      auditory: { en: translations.en.research.auditory, ja: translations.ja.research.auditory },
      auditoryDesc: { en: translations.en.research.auditoryDesc, ja: translations.ja.research.auditoryDesc },
      reservoir: { en: translations.en.research.reservoir, ja: translations.ja.research.reservoir },
      reservoirDesc: { en: translations.en.research.reservoirDesc, ja: translations.ja.research.reservoirDesc },
    },
    stats: {
      publications: { en: translations.en.stats.publications, ja: translations.ja.stats.publications },
      conferences: { en: translations.en.stats.conferences, ja: translations.ja.stats.conferences },
      members: { en: translations.en.stats.members, ja: translations.ja.stats.members },
      years: { en: translations.en.stats.years, ja: translations.ja.stats.years },
    },
    members: {
      title: { en: translations.en.members.title, ja: translations.ja.members.title },
      description: { en: translations.en.members.description, ja: translations.ja.members.description },
      faculty: { en: translations.en.members.faculty, ja: translations.ja.members.faculty },
      staff: { en: translations.en.members.staff, ja: translations.ja.members.staff },
      graduateStudents: { en: translations.en.members.graduateStudents, ja: translations.ja.members.graduateStudents },
      undergraduates: { en: translations.en.members.undergraduates, ja: translations.ja.members.undergraduates },
      visitors: { en: translations.en.members.visitors, ja: translations.ja.members.visitors },
      alumni: { en: translations.en.members.alumni, ja: translations.ja.members.alumni },
      joinUs: { en: translations.en.members.joinUs, ja: translations.ja.members.joinUs },
      joinUsDesc: { en: translations.en.members.joinUsDesc, ja: translations.ja.members.joinUsDesc },
      getInTouch: { en: translations.en.members.getInTouch, ja: translations.ja.members.getInTouch },
      researchInterests: { en: translations.en.members.researchInterests, ja: translations.ja.members.researchInterests },
      education: { en: translations.en.members.education, ja: translations.ja.members.education },
      awards: { en: translations.en.members.awards, ja: translations.ja.members.awards },
    },
    publications: {
      title: { en: translations.en.publications.title, ja: translations.ja.publications.title },
      description: { en: translations.en.publications.description, ja: translations.ja.publications.description },
      searchPlaceholder: { en: translations.en.publications.searchPlaceholder, ja: translations.ja.publications.searchPlaceholder },
      allTypes: { en: translations.en.publications.allTypes, ja: translations.ja.publications.allTypes },
      journal: { en: translations.en.publications.journal, ja: translations.ja.publications.journal },
      conference: { en: translations.en.publications.conference, ja: translations.ja.publications.conference },
      book: { en: translations.en.publications.book, ja: translations.ja.publications.book },
      review: { en: translations.en.publications.review, ja: translations.ja.publications.review },
      allYears: { en: translations.en.publications.allYears, ja: translations.ja.publications.allYears },
      allTopics: { en: translations.en.publications.allTopics, ja: translations.ja.publications.allTopics },
      showing: { en: translations.en.publications.showing, ja: translations.ja.publications.showing },
      of: { en: translations.en.publications.of, ja: translations.ja.publications.of },
      publicationsLabel: { en: translations.en.publications.publicationsLabel, ja: translations.ja.publications.publicationsLabel },
      publication: { en: translations.en.publications.publication, ja: translations.ja.publications.publication },
    },
    news: {
      title: { en: translations.en.news.title, ja: translations.ja.news.title },
      description: { en: translations.en.news.description, ja: translations.ja.news.description },
      stayUpdated: { en: translations.en.news.stayUpdated, ja: translations.ja.news.stayUpdated },
      stayUpdatedDesc: { en: translations.en.news.stayUpdatedDesc, ja: translations.ja.news.stayUpdatedDesc },
    },
    contact: {
      title: { en: translations.en.contact.title, ja: translations.ja.contact.title },
      description: { en: translations.en.contact.description, ja: translations.ja.contact.description },
      address: { en: translations.en.contact.address, ja: translations.ja.contact.address },
      email: { en: translations.en.contact.email, ja: translations.ja.contact.email },
      access: { en: translations.en.contact.access, ja: translations.ja.contact.access },
      byTrain: { en: translations.en.contact.byTrain, ja: translations.ja.contact.byTrain },
      affiliations: { en: translations.en.contact.affiliations, ja: translations.ja.contact.affiliations },
      forStudents: { en: translations.en.contact.forStudents, ja: translations.ja.contact.forStudents },
      forStudentsDesc: { en: translations.en.contact.forStudentsDesc, ja: translations.ja.contact.forStudentsDesc },
      sendInquiry: { en: translations.en.contact.sendInquiry, ja: translations.ja.contact.sendInquiry },
      openLabInfo: { en: translations.en.contact.openLabInfo, ja: translations.ja.contact.openLabInfo },
    },
    footer: {
      navigation: { en: translations.en.footer.navigation, ja: translations.ja.footer.navigation },
      affiliations: { en: translations.en.footer.affiliations, ja: translations.ja.footer.affiliations },
      contact: { en: translations.en.footer.contact, ja: translations.ja.footer.contact },
      description: { en: translations.en.footer.description, ja: translations.ja.footer.description },
      rights: { en: translations.en.footer.rights, ja: translations.ja.footer.rights },
    },
    categories: {
      publication: { en: translations.en.categories.publication, ja: translations.ja.categories.publication },
      award: { en: translations.en.categories.award, ja: translations.ja.categories.award },
      event: { en: translations.en.categories.event, ja: translations.ja.categories.event },
      media: { en: translations.en.categories.media, ja: translations.ja.categories.media },
      announcement: { en: translations.en.categories.announcement, ja: translations.ja.categories.announcement },
      all: { en: translations.en.categories.all, ja: translations.ja.categories.all },
    },
  };

  const filePath = path.join(contentDir, 'translations.yaml');
  fs.writeFileSync(filePath, yaml.dump(converted, { lineWidth: -1, noRefs: true }));
  console.log(`  Created: translations.yaml`);
}

// Main migration function
async function migrate() {
  console.log('Starting content migration...\n');

  console.log('Migrating members...');
  migrateMembers();

  console.log('\nMigrating news...');
  migrateNews();

  console.log('\nMigrating books...');
  migrateBooks();

  console.log('\nMigrating media appearances...');
  migrateMediaAppearances();

  console.log('\nMigrating YouTube channel...');
  migrateYouTube();

  console.log('\nMigrating serializations...');
  migrateSerializations();

  console.log('\nMigrating translations...');
  migrateTranslations();

  console.log('\nMigration complete!');
}

migrate().catch(console.error);
