'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Publication } from '@/lib/content';

const typeLabels: Record<string, { en: string; ja: string }> = {
  all: { en: 'All', ja: 'すべて' },
  journal: { en: 'Journal Articles', ja: '学術論文' },
  conference: { en: 'Conference Papers', ja: '国際会議' },
  book: { en: 'Books', ja: '書籍' },
  review: { en: 'Reviews', ja: '総説' },
  preprint: { en: 'Preprints', ja: 'プレプリント' },
};

interface PublicationsClientProps {
  publications: Publication[];
  allTags: string[];
}

export default function PublicationsClient({ publications, allTags }: PublicationsClientProps) {
  const { t, language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const publicationTypes = ['all', 'journal', 'conference', 'book', 'review', 'preprint'];

  const formatText = (text: { en: string; ja: string }, vars: Record<string, string | number>) => {
    let result = t(text);
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(`{${key}}`, String(value));
    }
    return result;
  };

  const texts = {
    backToHome: { en: 'Back to Home', ja: 'ホームに戻る' },
    sectionLabel: { en: 'Research Output', ja: '研究成果' },
    title: { en: 'Publications', ja: '業績' },
    description: {
      en: 'Our research output spanning neural computation, brain-computer interfaces, and auditory neuroscience.',
      ja: '神経計算、ブレイン・コンピュータ・インタフェース、聴覚神経科学に関する研究成果。'
    },
    searchPlaceholder: { en: 'Search publications...', ja: '業績を検索...' },
    allYears: { en: 'All Years', ja: 'すべての年' },
    allTopics: { en: 'All Topics', ja: 'すべてのトピック' },
    resultsCount: { en: 'Showing {shown} of {total} publications', ja: '{total}件中{shown}件を表示' },
    noResults: { en: 'No publications found matching your criteria.', ja: '条件に一致する業績が見つかりません。' },
  };

  const years = useMemo(() => {
    const uniqueYears = [...new Set(publications.map((p) => p.year))].sort((a, b) => b - a);
    return ['all', ...uniqueYears.map(String)];
  }, [publications]);

  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      const matchesSearch =
        searchQuery === '' ||
        pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.authors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
        pub.journal.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || pub.type === selectedType;
      const matchesYear = selectedYear === 'all' || pub.year.toString() === selectedYear;
      const matchesTag = selectedTag === 'all' || pub.tags?.includes(selectedTag);

      return matchesSearch && matchesType && matchesYear && matchesTag;
    });
  }, [publications, searchQuery, selectedType, selectedYear, selectedTag]);

  const groupedByYear = useMemo(() => {
    const grouped: Record<number, Publication[]> = {};
    filteredPublications.forEach((pub) => {
      if (!grouped[pub.year]) {
        grouped[pub.year] = [];
      }
      grouped[pub.year].push(pub);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, pubs]) => ({ year: Number(year), publications: pubs }));
  }, [filteredPublications]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <header className="pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            {t(texts.backToHome)}
          </Link>
          <p className="section-label">{t(texts.sectionLabel)}</p>
          <h1 className="mb-4">{t(texts.title)}</h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            {t(texts.description)}
          </p>
        </div>
      </header>

      {/* Filters */}
      <section className="py-4 sticky top-16 z-40 bg-white border-y border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={t(texts.searchPlaceholder)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {/* Type filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            >
              {publicationTypes.map((type) => (
                <option key={type} value={type}>
                  {t(typeLabels[type] || { en: type, ja: type })}
                </option>
              ))}
            </select>

            {/* Year filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <option value="all">{t(texts.allYears)}</option>
              {years.slice(1).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {/* Tag filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2.5 bg-[var(--bg-alt)] border border-[var(--border)] rounded text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <option value="all">{t(texts.allTopics)}</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-[var(--text-muted)]">
            {formatText(texts.resultsCount, { shown: filteredPublications.length, total: publications.length })}
          </div>
        </div>
      </section>

      {/* Publications list */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          {groupedByYear.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-secondary)]">
                {t(texts.noResults)}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {groupedByYear.map(({ year, publications: yearPubs }) => (
                <div key={year}>
                  {/* Year header */}
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-3xl font-bold text-[var(--accent)]">{year}</h2>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-sm text-[var(--text-muted)]">
                      {language === 'en'
                        ? `${yearPubs.length} publication${yearPubs.length !== 1 ? 's' : ''}`
                        : `${yearPubs.length}件`}
                    </span>
                  </div>

                  {/* Publications for this year */}
                  <div className="space-y-4">
                    {yearPubs.map((pub) => (
                      <article key={pub.id} className="p-6 bg-white border border-[var(--border)] rounded-lg hover:border-[var(--border-hover)] transition-colors">
                        {/* Title */}
                        <h3 className="font-semibold text-[var(--text)] mb-2 leading-snug">{pub.title}</h3>

                        {/* Authors */}
                        <p className="text-sm text-[var(--text-secondary)] mb-2">{pub.authors.join(', ')}</p>

                        {/* Journal info */}
                        <p className="text-sm text-[var(--text-muted)] mb-3">
                          <span className="italic">{pub.journal}</span>
                          {pub.volume && `, ${pub.volume}`}
                          {pub.pages && `, ${pub.pages}`}
                        </p>

                        {/* Tags and links */}
                        <div className="flex flex-wrap items-center gap-2">
                          {pub.tags?.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setSelectedTag(tag)}
                              className="tag hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                            >
                              {tag}
                            </button>
                          ))}

                          {pub.doi && (
                            <a
                              href={`https://doi.org/${pub.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                            >
                              DOI
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {pub.pubmed && (
                            <a
                              href={`https://pubmed.ncbi.nlm.nih.gov/${pub.pubmed}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                            >
                              PubMed
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
