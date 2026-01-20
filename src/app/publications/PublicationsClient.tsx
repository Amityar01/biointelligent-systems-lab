'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ExternalLink } from 'lucide-react';
import type { Publication } from '@/lib/content';

const typeLabels: Record<string, string> = {
  all: 'All',
  journal: 'Journal Articles',
  conference: 'Conference Papers',
  book: 'Books',
  review: 'Reviews',
  preprint: 'Preprints',
};

interface PublicationsClientProps {
  publications: Publication[];
  allTags: string[];
}

export default function PublicationsClient({ publications, allTags }: PublicationsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const publicationTypes = ['all', 'journal', 'conference', 'book', 'review', 'preprint'];

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
      {/* Grid Overlay */}
      <div className="grid-overlay" />


      {/* Hero */}
      <header className="pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <p className="section-label">Research Output</p>
          <h1 className="mb-6">Publications</h1>
          <p className="text-xl lg:text-2xl text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            Our research output spanning neural computation, brain-computer interfaces,
            and auditory neuroscience.
          </p>
        </div>
      </header>

      {/* Filters */}
      <section className="py-6 sticky top-16 z-40 bg-[var(--bg)] border-y border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search publications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {/* Type filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            >
              {publicationTypes.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>

            {/* Year filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <option value="all">All Years</option>
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
              className="px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <option value="all">All Topics</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-[var(--text-muted)]">
            Showing {filteredPublications.length} of {publications.length} publications
          </div>
        </div>
      </section>

      {/* Publications list */}
      <section className="py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {groupedByYear.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-secondary)]">
                No publications found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {groupedByYear.map(({ year, publications: yearPubs }) => (
                <div key={year}>
                  {/* Year header */}
                  <div className="flex items-center gap-6 mb-8">
                    <h2 className="stat-number text-5xl">{year}</h2>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-sm text-[var(--text-muted)]">
                      {yearPubs.length} publication{yearPubs.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Publications for this year */}
                  <div className="divide-y divide-[var(--border)]">
                    {yearPubs.map((pub) => (
                      <article key={pub.id} className="pub-item flex gap-6">
                        <div className="flex-1">
                          {/* Title */}
                          <h3 className="pub-title mb-2">{pub.title}</h3>

                          {/* Authors */}
                          <p className="pub-authors mb-2">{pub.authors.join(', ')}</p>

                          {/* Journal info */}
                          <p className="pub-journal mb-3">
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
