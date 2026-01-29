'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ExternalLink, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Publication } from '@/lib/content';
import {
  loadEmbeddings,
  hybridSearch,
  getQueryEmbedding,
  keywordScore,
  type SearchResult,
} from '@/lib/semantic-search';

const typeLabels: Record<string, { en: string; ja: string }> = {
  all: { en: 'All', ja: 'すべて' },
  papers: { en: 'Papers', ja: '論文' },
  journal: { en: 'Journal', ja: '学術論文' },
  preprint: { en: 'Preprint', ja: 'プレプリント' },
  conference: { en: 'Conference', ja: '国際会議' },
  presentation: { en: 'Presentation', ja: '発表' },
  poster: { en: 'Poster', ja: 'ポスター' },
  thesis: { en: 'Thesis', ja: '学位論文' },
  book: { en: 'Book', ja: '書籍' },
  review: { en: 'Review', ja: '総説' },
  media: { en: 'Media', ja: 'メディア' },
  grant: { en: 'Grant', ja: '研究費' },
  report: { en: 'Report', ja: '報告' },
  award: { en: 'Award', ja: '受賞' },
};

// Category colors for auto-labels
const categoryColors: Record<string, string> = {
  model: 'bg-blue-50 text-blue-700 border-blue-200',
  technique: 'bg-green-50 text-green-700 border-green-200',
  domain: 'bg-purple-50 text-purple-700 border-purple-200',
};

const categoryLabels: Record<string, { en: string; ja: string }> = {
  model: { en: 'Model', ja: 'モデル' },
  technique: { en: 'Technique', ja: '技術' },
  domain: { en: 'Domain', ja: '分野' },
};

// Parse auto-label like "model:rat-invivo" into { category, label }
function parseAutoLabel(tag: string): { category: string; label: string } | null {
  const match = tag.match(/^(model|technique|domain):(.+)$/);
  if (match) {
    return { category: match[1], label: match[2] };
  }
  return null;
}

interface PublicationsClientProps {
  publications: Publication[];
  allTags: string[];
}

export default function PublicationsClient({ publications, allTags }: PublicationsClientProps) {
  const { t, language } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('papers');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedTechnique, setSelectedTechnique] = useState<string>('all');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  // Semantic search state
  const [embeddings, setEmbeddings] = useState<Map<string, number[]>>(new Map());
  const [queryEmbedding, setQueryEmbedding] = useState<number[] | null>(null);
  const [isSemanticEnabled, setIsSemanticEnabled] = useState(false);
  const [isLoadingEmbedding, setIsLoadingEmbedding] = useState(false);

  const publicationTypes = ['all', 'papers', 'journal', 'preprint', 'conference', 'presentation', 'poster', 'thesis', 'book', 'review', 'media', 'grant', 'report', 'award'];

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
    semanticSearch: { en: 'Semantic search', ja: 'セマンティック検索' },
  };

  // Load embeddings on mount
  useEffect(() => {
    loadEmbeddings().then(setEmbeddings);
  }, []);

  // Debounced query embedding fetch
  const fetchQueryEmbedding = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setQueryEmbedding(null);
      return;
    }

    setIsLoadingEmbedding(true);
    try {
      const embedding = await getQueryEmbedding(query);
      setQueryEmbedding(embedding);
      if (embedding) {
        setIsSemanticEnabled(true);
      }
    } catch {
      setQueryEmbedding(null);
    } finally {
      setIsLoadingEmbedding(false);
    }
  }, []);

  // Debounce query embedding requests
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQueryEmbedding(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchQueryEmbedding]);

  const years = useMemo(() => {
    const uniqueYears = [...new Set(publications.map((p) => p.year))].sort((a, b) => b - a);
    return ['all', ...uniqueYears.map(String)];
  }, [publications]);

  // Extract auto-labels grouped by category
  const autoLabels = useMemo(() => {
    const labels: Record<string, Set<string>> = { model: new Set(), technique: new Set(), domain: new Set() };
    for (const pub of publications) {
      for (const tag of pub.tags || []) {
        const parsed = parseAutoLabel(tag);
        if (parsed && labels[parsed.category]) {
          labels[parsed.category].add(parsed.label);
        }
      }
    }
    return {
      model: Array.from(labels.model).sort(),
      technique: Array.from(labels.technique).sort(),
      domain: Array.from(labels.domain).sort(),
    };
  }, [publications]);

  // Non-auto tags (language tags, etc)
  const manualTags = useMemo(() => {
    return allTags.filter(tag => !tag.includes(':'));
  }, [allTags]);

  // Hybrid search with filters
  const filteredPublications = useMemo(() => {
    // First apply type/year/tag/category filters
    const preFiltered = publications.filter((pub) => {
      const matchesType = selectedType === 'all' ||
        (selectedType === 'papers' ? (pub.type === 'journal' || pub.type === 'preprint') : pub.type === selectedType);
      const matchesYear = selectedYear === 'all' || (pub.year && pub.year.toString() === selectedYear);
      const matchesTag = selectedTag === 'all' || pub.tags?.includes(selectedTag);
      const matchesModel = selectedModel === 'all' || pub.tags?.includes(`model:${selectedModel}`);
      const matchesTechnique = selectedTechnique === 'all' || pub.tags?.includes(`technique:${selectedTechnique}`);
      const matchesDomain = selectedDomain === 'all' || pub.tags?.includes(`domain:${selectedDomain}`);
      return matchesType && matchesYear && matchesTag && matchesModel && matchesTechnique && matchesDomain;
    });

    // If no search query, return all pre-filtered results
    if (!searchQuery.trim()) {
      return preFiltered;
    }

    // Use semantic search if embeddings are available
    if (embeddings.size > 0) {
      const searchResults = hybridSearch(
        searchQuery,
        preFiltered,
        queryEmbedding,
        embeddings,
        0.25 // Lower threshold for more results
      );
      return searchResults.map(r => r.publication);
    }

    // Fallback to simple keyword search
    const query = searchQuery.toLowerCase();
    return preFiltered.filter((pub) => {
      const searchText = [
        pub.title || '',
        pub.authors?.join(' ') || '',
        pub.journal || '',
        pub.tags?.join(' ') || '',
      ].join(' ').toLowerCase();

      return searchText.includes(query) || keywordScore(searchQuery, searchText) > 0;
    });
  }, [publications, searchQuery, selectedType, selectedYear, selectedTag, selectedModel, selectedTechnique, selectedDomain, embeddings, queryEmbedding]);

  const groupedByYear = useMemo(() => {
    // When searching, don't group by year - show by relevance
    if (searchQuery.trim()) {
      return [{ year: 0, publications: filteredPublications }];
    }

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
  }, [filteredPublications, searchQuery]);

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
      <section className="py-4 sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-y border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder={t(texts.searchPlaceholder)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-[var(--text)] text-base placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
              {/* Semantic search indicator */}
              {isLoadingEmbedding && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!isLoadingEmbedding && isSemanticEnabled && queryEmbedding && searchQuery.trim() && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-[var(--accent)]">
                  <Sparkles className="w-3 h-3" />
                  <span className="hidden sm:inline">{t(texts.semanticSearch)}</span>
                </div>
              )}
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-3">
              {/* Type filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-2 bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all cursor-pointer"
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
                className="flex-1 min-w-[100px] px-3 py-2 bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="all">{t(texts.allYears)}</option>
                {years.slice(1).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              {/* Model filter */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="all">{t(categoryLabels.model)}</option>
                {autoLabels.model.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>

              {/* Technique filter */}
              <select
                value={selectedTechnique}
                onChange={(e) => setSelectedTechnique(e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="all">{t(categoryLabels.technique)}</option>
                {autoLabels.technique.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>

              {/* Domain filter */}
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="all">{t(categoryLabels.domain)}</option>
                {autoLabels.domain.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>

              {/* Manual tag filter (if any) */}
              {manualTags.length > 0 && (
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="flex-1 min-w-[100px] px-3 py-2 bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="all">{t(texts.allTopics)}</option>
                  {manualTags.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Results count and clear filters */}
          <div className="mt-3 flex items-center gap-4 text-sm text-[var(--text-muted)]">
            <span>{formatText(texts.resultsCount, { shown: filteredPublications.length, total: publications.length })}</span>
            {(selectedModel !== 'all' || selectedTechnique !== 'all' || selectedDomain !== 'all' || selectedType !== 'papers' || selectedYear !== 'all' || selectedTag !== 'all') && (
              <button
                onClick={() => {
                  setSelectedModel('all');
                  setSelectedTechnique('all');
                  setSelectedDomain('all');
                  setSelectedType('papers');
                  setSelectedYear('all');
                  setSelectedTag('all');
                }}
                className="text-[var(--accent)] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Publications list */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          {groupedByYear.length === 0 || (groupedByYear.length === 1 && groupedByYear[0].publications.length === 0) ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-secondary)]">
                {t(texts.noResults)}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {groupedByYear.map(({ year, publications: yearPubs }) => (
                <div key={year}>
                  {/* Year header - only show when not searching */}
                  {year > 0 && (
                    <div className="flex items-center gap-4 mb-6">
                      <h2 className="text-3xl font-bold text-[var(--accent)]">{year}</h2>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                      <span className="text-sm text-[var(--text-muted)]">
                        {language === 'en'
                          ? `${yearPubs.length} publication${yearPubs.length !== 1 ? 's' : ''}`
                          : `${yearPubs.length}件`}
                      </span>
                    </div>
                  )}

                  {/* Publications for this year */}
                  <div className="space-y-4">
                    {yearPubs.map((pub) => (
                      <article key={pub.id} className="p-6 bg-white border border-[var(--border)] rounded-lg hover:border-[var(--border-hover)] transition-colors">
                        {/* Title */}
                        <h3 className="font-semibold text-[var(--text)] mb-2 leading-snug">{pub.title}</h3>

                        {/* Authors */}
                        <p className="text-sm text-[var(--text-secondary)] mb-2">{pub.authors?.join(', ')}</p>

                        {/* Journal info */}
                        <p className="text-sm text-[var(--text-muted)] mb-3">
                          <span className="italic">{pub.journal}</span>
                          {pub.volume && `, ${pub.volume}`}
                          {pub.pages && `, ${pub.pages}`}
                          {year > 0 ? '' : ` (${pub.year})`}
                        </p>

                        {/* Auto-labels */}
                        {pub.tags?.some(t => t.includes(':')) && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {pub.tags?.map((tag) => {
                              const parsed = parseAutoLabel(tag);
                              if (!parsed) return null;
                              const colorClass = categoryColors[parsed.category] || 'bg-gray-50 text-gray-700 border-gray-200';
                              return (
                                <button
                                  key={tag}
                                  onClick={() => {
                                    if (parsed.category === 'model') {
                                      setSelectedModel(selectedModel === parsed.label ? 'all' : parsed.label);
                                    } else if (parsed.category === 'technique') {
                                      setSelectedTechnique(selectedTechnique === parsed.label ? 'all' : parsed.label);
                                    } else if (parsed.category === 'domain') {
                                      setSelectedDomain(selectedDomain === parsed.label ? 'all' : parsed.label);
                                    }
                                  }}
                                  className={`px-2 py-0.5 text-xs border rounded-full ${colorClass} hover:opacity-80 transition-opacity cursor-pointer`}
                                >
                                  {parsed.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Manual tags and links */}
                        <div className="flex flex-wrap items-center gap-2">
                          {pub.tags?.filter(t => !t.includes(':')).map((tag) => (
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
