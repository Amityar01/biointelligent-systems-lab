import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const contentDirectory = path.join(process.cwd(), 'content');

// ========================================
// TYPES
// ========================================

export interface BilingualText {
  en: string;
  ja: string;
}

export interface MemberLinks {
  researchmap?: string;
  googleScholar?: string;
  orcid?: string;
  website?: string;
  loop?: string;
}

export interface Member {
  id: string;
  slug: string;
  category: 'faculty' | 'staff' | 'students' | 'undergraduates' | 'visitors' | 'alumni';
  name: BilingualText;
  role: BilingualText;
  bio: BilingualText;
  image?: string;
  email?: string;
  links?: MemberLinks;
  research?: string[];
  education?: string[];
  awards?: string[];
  personalPageContent?: string;
}

export interface NewsItem {
  id: string;
  title: BilingualText;
  date: string;
  category: 'publication' | 'award' | 'event' | 'media' | 'announcement';
  excerpt: BilingualText;
  content?: string;
  image?: string;
  link?: string;
}

export interface Book {
  id: string;
  title: BilingualText;
  publisher: BilingualText;
  year: number;
  description: BilingualText;
  image?: string;
  amazon?: string;
  publisher_url?: string;
}

export interface MediaAppearance {
  id: string;
  title: BilingualText;
  outlet: string;
  date: string;
  type: 'tv' | 'radio' | 'newspaper' | 'magazine' | 'online' | 'international';
  description: BilingualText;
  link?: string;
}

export interface YouTubeChannel {
  name: BilingualText;
  url: string;
  description: BilingualText;
}

export interface Serialization {
  id: string;
  title: BilingualText;
  publication: BilingualText;
  period: string;
  description: BilingualText;
}

export interface Translations {
  nav: {
    home: BilingualText;
    research: BilingualText;
    members: BilingualText;
    publications: BilingualText;
    news: BilingualText;
    contact: BilingualText;
  };
  home: {
    tagline: BilingualText;
    labName: BilingualText;
    subtitle: BilingualText;
    mission: BilingualText;
  };
  categories: {
    publication: BilingualText;
    award: BilingualText;
    event: BilingualText;
    media: BilingualText;
    announcement: BilingualText;
    all: BilingualText;
  };
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getFilesFromDirectory(dir: string, extension: string): string[] {
  const fullPath = path.join(contentDirectory, dir);
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  return fs.readdirSync(fullPath).filter(file => file.endsWith(extension));
}

function readYamlFile<T>(filePath: string): T | null {
  const fullPath = path.join(contentDirectory, filePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  return yaml.load(fileContents) as T;
}

function readMarkdownFile<T>(filePath: string): { data: T; content: string } | null {
  const fullPath = path.join(contentDirectory, filePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  return { data: data as T, content };
}

// ========================================
// MEMBERS
// ========================================

const memberCategories = ['faculty', 'staff', 'students', 'undergraduates', 'visitors', 'alumni'] as const;

export function getAllMembers(): Member[] {
  const allMembers: Member[] = [];

  for (const category of memberCategories) {
    const dir = `members/${category}`;
    const files = getFilesFromDirectory(dir, '.yaml');

    for (const file of files) {
      const data = readYamlFile<Omit<Member, 'category'>>(`${dir}/${file}`);
      if (data) {
        allMembers.push({
          ...data,
          category,
        });
      }
    }
  }

  return allMembers;
}

export function getMembersByCategory(category: Member['category']): Member[] {
  return getAllMembers().filter(m => m.category === category);
}

export function getMemberBySlug(slug: string): Member | null {
  const allMembers = getAllMembers();
  return allMembers.find(m => m.slug === slug) || null;
}

export function getFaculty(): Member[] {
  return getMembersByCategory('faculty');
}

export function getStaff(): Member[] {
  return getMembersByCategory('staff');
}

export function getStudents(): Member[] {
  return getMembersByCategory('students');
}

export function getUndergraduates(): Member[] {
  return getMembersByCategory('undergraduates');
}

export function getVisitors(): Member[] {
  return getMembersByCategory('visitors');
}

export function getAlumni(): Member[] {
  return getMembersByCategory('alumni');
}

// ========================================
// NEWS
// ========================================

interface NewsData {
  id: string;
  title: BilingualText;
  date: string;
  category: NewsItem['category'];
  excerpt: BilingualText;
  image?: string;
  link?: string;
}

export function getAllNews(): NewsItem[] {
  const dir = 'news';
  const files = getFilesFromDirectory(dir, '.md');

  const newsItems: NewsItem[] = [];

  for (const file of files) {
    const result = readMarkdownFile<NewsData>(`${dir}/${file}`);
    if (result) {
      newsItems.push({
        ...result.data,
        content: result.content || undefined,
      });
    }
  }

  // Sort by date descending
  return newsItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getNewsByCategory(category: NewsItem['category']): NewsItem[] {
  return getAllNews().filter(n => n.category === category);
}

export function getNewsById(id: string): NewsItem | null {
  return getAllNews().find(n => n.id === id) || null;
}

// ========================================
// MEDIA (BOOKS, APPEARANCES, ETC.)
// ========================================

export function getAllBooks(): Book[] {
  const dir = 'media/books';
  const files = getFilesFromDirectory(dir, '.yaml');

  const books: Book[] = [];
  for (const file of files) {
    const data = readYamlFile<Book>(`${dir}/${file}`);
    if (data) {
      books.push(data);
    }
  }

  // Sort by year descending
  return books.sort((a, b) => b.year - a.year);
}

export function getAllMediaAppearances(): MediaAppearance[] {
  const dir = 'media/appearances';
  const files = getFilesFromDirectory(dir, '.yaml');

  const appearances: MediaAppearance[] = [];
  for (const file of files) {
    const data = readYamlFile<MediaAppearance>(`${dir}/${file}`);
    if (data) {
      appearances.push(data);
    }
  }

  // Sort by date descending
  return appearances.sort((a, b) => b.date.localeCompare(a.date));
}

export function getYouTubeChannel(): YouTubeChannel | null {
  return readYamlFile<YouTubeChannel>('media/youtube.yaml');
}

export function getAllSerializations(): Serialization[] {
  const dir = 'media/serializations';
  const files = getFilesFromDirectory(dir, '.yaml');

  const serializations: Serialization[] = [];
  for (const file of files) {
    const data = readYamlFile<Serialization>(`${dir}/${file}`);
    if (data) {
      serializations.push(data);
    }
  }

  return serializations;
}

// ========================================
// TRANSLATIONS
// ========================================

export function getTranslations(): Translations | null {
  return readYamlFile<Translations>('translations.yaml');
}

// ========================================
// CATEGORY LABELS (for news filtering)
// ========================================

export const categoryLabels: Record<string, { en: string; ja: string; color: string }> = {
  publication: { en: 'Publication', ja: '論文', color: 'cyan' },
  award: { en: 'Award', ja: '受賞', color: 'magenta' },
  event: { en: 'Event', ja: 'イベント', color: 'purple' },
  media: { en: 'Media', ja: 'メディア', color: 'amber' },
  announcement: { en: 'Announcement', ja: 'お知らせ', color: 'green' },
};

export const newsCategories = ['all', 'publication', 'award', 'event', 'media', 'announcement'] as const;
