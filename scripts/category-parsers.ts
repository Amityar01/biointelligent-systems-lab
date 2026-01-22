/**
 * Category-specific parsers for publications
 * Strategy: Regex first → Schema validate → LLM fallback if invalid
 */

export interface ParsedPublication {
  authors: string[];
  title: string;
  year: number | null;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  publisher?: string;
  conference?: string;
  location?: string;
  date?: string;
  awards?: string[];
  type: string;
}

// ============================================================
// REGEX PARSERS BY CATEGORY
// ============================================================

export function parseOriginalJa(raw: string): ParsedPublication | null {
  // Pattern: (1) 著者1, 著者2:「タイトル」, 雑誌名 Vol(Issue): pp.pages, year (doi: xxx)

  // Extract authors (before :「 or ：「)
  const authorsMatch = raw.match(/^\(\d+\)\s*([^:：]+)[:：]\s*「/);
  if (!authorsMatch) return null;
  const authors = authorsMatch[1].split(/[,，、]/).map(a => a.trim()).filter(a => a.length > 0);

  // Extract title (in 「」)
  const titleMatch = raw.match(/「([^」]+)」/);
  if (!titleMatch) return null;
  const title = titleMatch[1];

  // Extract journal and volume
  const journalMatch = raw.match(/」[,，]\s*([^0-9]+?)\s*(\d+)\s*\((\d+)\)/);
  const journal = journalMatch ? journalMatch[1].trim() : undefined;
  const volume = journalMatch ? journalMatch[2] : undefined;
  const issue = journalMatch ? journalMatch[3] : undefined;

  // Extract pages
  const pagesMatch = raw.match(/pp?\.\s*([0-9]+-[0-9]+)/);
  const pages = pagesMatch ? pagesMatch[1] : undefined;

  // Extract year
  const yearMatch = raw.match(/[,，]\s*((?:19|20)\d{2})\s*(?:\(|$|doi)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract DOI
  const doiMatch = raw.match(/doi[:\s]*([0-9.]+\/[^\s\)]+)/i);
  const doi = doiMatch ? doiMatch[1] : undefined;

  return { authors, title, year, journal, volume, issue, pages, doi, type: 'journal' };
}

export function parseOriginalEn(raw: string): ParsedPublication | null {
  // Pattern: (1) Authors: "Title." Journal Vol(Issue): pp. pages, year (doi: xxx)
  // Handle both straight quotes "" and curly quotes "" (use Unicode escapes)

  // Extract authors (before : " or : ")
  const authorsMatch = raw.match(/^\(\d+\)\s*([^:]+):\s*["\u201c]/);
  if (!authorsMatch) return null;
  const authorsRaw = authorsMatch[1];
  const authors = authorsRaw.split(/,\s*(?:and\s+)?/).map(a => a.trim()).filter(a => a.length > 0 && !a.match(/^\d/));

  // Extract title (in "" or "")
  const titleMatch = raw.match(/["\u201c]([^"\u201c\u201d]+)["\u201d]/);
  if (!titleMatch) return null;
  const title = titleMatch[1].replace(/\.$/, '');

  // Extract journal and volume
  const journalMatch = raw.match(/["\u201d]\s+([A-Za-z][^0-9]+?)\s+(\d+)\s*\((\d+)\)/);
  const journal = journalMatch ? journalMatch[1].trim() : undefined;
  const volume = journalMatch ? journalMatch[2] : undefined;
  const issue = journalMatch ? journalMatch[3] : undefined;

  // Extract pages
  const pagesMatch = raw.match(/pp?\.?\s*([0-9]+-[0-9]+)/);
  const pages = pagesMatch ? pagesMatch[1] : undefined;

  // Extract year
  const yearMatch = raw.match(/[,:\s]\s*((?:19|20)\d{2})\s*(?:\(|$|doi)/i);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract DOI
  const doiMatch = raw.match(/doi[:\s]*([0-9.]+\/[^\s\)]+)/i);
  const doi = doiMatch ? doiMatch[1] : undefined;

  return { authors, title, year, journal, volume, issue, pages, doi, type: 'journal' };
}

export function parseConference(raw: string): ParsedPublication | null {
  // Pattern: (1) Authors: "Title." Proceedings of Conference: pp.pages, year (Location, date) [Award]
  // Handle both straight quotes "" and curly quotes "" (use Unicode escapes)

  // Extract authors
  const authorsMatch = raw.match(/^\(\d+\)\s*([^:]+):\s*["\u201c]/);
  if (!authorsMatch) return null;
  const authorsRaw = authorsMatch[1];
  const authors = authorsRaw.split(/,\s*(?:and\s+)?/).map(a => a.trim()).filter(a => a.length > 0 && !a.match(/^\d/));

  // Extract title
  const titleMatch = raw.match(/["\u201c]([^"\u201c\u201d]+)["\u201d]/);
  if (!titleMatch) return null;
  const title = titleMatch[1].replace(/\.$/, '');

  // Extract conference name
  const confMatch = raw.match(/["\u201d]\s+(Proceedings[^:]+)/i);
  const conference = confMatch ? confMatch[1].trim() : undefined;

  // Extract pages
  const pagesMatch = raw.match(/pp?\.?\s*([0-9]+-[0-9]+|[0-9]+)/);
  const pages = pagesMatch ? pagesMatch[1] : undefined;

  // Extract year
  const yearMatch = raw.match(/[,\s]((?:19|20)\d{2})年?\d*月?\d*日?\)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract location
  const locMatch = raw.match(/\(([^,，]+)[,，]\s*(?:19|20)\d{2}/);
  const location = locMatch ? locMatch[1].trim() : undefined;

  // Extract awards
  const awardMatch = raw.match(/\[([^\]]+)\]/);
  const awards = awardMatch ? [awardMatch[1]] : undefined;

  return { authors, title, year, conference, pages, location, awards, type: 'conference' };
}

export function parseReview(raw: string): ParsedPublication | null {
  // Same as original_ja but may have [招待論文]
  const result = parseOriginalJa(raw);
  if (result) {
    result.type = 'review';
    const invitedMatch = raw.match(/\[(招待論文|invited)\]/i);
    if (invitedMatch) {
      result.awards = [invitedMatch[1]];
    }
  }
  return result;
}

export function parseBook(raw: string): ParsedPublication | null {
  // Pattern: (1) Authors: 「Title」，Publisher, City, year (ISBN)

  // Extract authors
  const authorsMatch = raw.match(/^\(\d+\)\s*([^:：]+)[:：]\s*「/);
  if (!authorsMatch) return null;
  const authors = authorsMatch[1].split(/[,，、]/).map(a => a.trim()).filter(a => a.length > 0);

  // Extract title
  const titleMatch = raw.match(/「([^」]+)」/);
  if (!titleMatch) return null;
  const title = titleMatch[1];

  // Extract publisher
  const pubMatch = raw.match(/」[，,]\s*([^，,]+?)[，,]\s*(?:東京|大阪|京都)/);
  const publisher = pubMatch ? pubMatch[1] : undefined;

  // Extract year
  const yearMatch = raw.match(/((?:19|20)\d{2})年?\s*(?:\(|$)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  return { authors, title, year, publisher, type: 'book' };
}

export function parseOral(raw: string): ParsedPublication | null {
  // Pattern: (1) Authors：「Title」，Event (Location，date) [Keynote]
  // Handle Japanese (：「」), English straight (""), and English curly ("") quotes

  // Extract authors - handle both : and ： and all quote types
  const authorsMatch = raw.match(/^\(\d+\)\s*([^:：「"\u201c]+)[:：]\s*[「"\u201c]/);
  if (!authorsMatch) return null;
  const authors = authorsMatch[1].split(/[,，、]\s*(?:and\s+)?/).map(a => a.trim()).filter(a => a.length > 0);

  // Extract title - handle 「」, "", and ""
  const titleMatch = raw.match(/[「"\u201c]([^」"\u201c\u201d]+)[」"\u201d]/);
  if (!titleMatch) return null;
  const title = titleMatch[1].replace(/\.$/, '');

  // Extract conference/event (after closing quote)
  const eventMatch = raw.match(/[」"\u201d][，,.\s]+([^(（]+)/);
  const conference = eventMatch ? eventMatch[1].trim() : undefined;

  // Extract year
  const yearMatch = raw.match(/((?:19|20)\d{2})年?\d*月?\d*日?[,\s]*\)/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  // Extract location
  const locMatch = raw.match(/\(([^，,\d]+)[，,]/);
  const location = locMatch ? locMatch[1].trim() : undefined;

  // Extract keynote/invited/awards
  const keyMatch = raw.match(/\[([^\]]+)\]/i);
  const awards = keyMatch ? [keyMatch[1]] : undefined;

  return { authors, title, year, conference, location, awards, type: 'presentation' };
}

export function parseSeminars(raw: string): ParsedPublication | null {
  // Same pattern as oral
  return parseOral(raw);
}

// ============================================================
// MAIN PARSER SELECTOR
// ============================================================

export function parseByCategory(raw: string, category: string): ParsedPublication | null {
  switch (category) {
    case 'original_ja': return parseOriginalJa(raw);
    case 'original_en': return parseOriginalEn(raw);
    case 'conference': return parseConference(raw);
    case 'review': return parseReview(raw);
    case 'book': return parseBook(raw);
    case 'oral': return parseOral(raw);
    case 'seminars': return parseSeminars(raw);
    default: return null;
  }
}

// ============================================================
// VALIDATION
// ============================================================

export function isValid(pub: ParsedPublication | null): boolean {
  if (!pub) return false;
  if (!pub.authors || pub.authors.length === 0) return false;
  if (!pub.title || pub.title.length === 0) return false;
  return true;
}
