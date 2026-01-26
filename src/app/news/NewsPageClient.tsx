'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { NewsItem } from '@/lib/content';

interface Props {
  news: NewsItem[];
  categoryLabels: Record<string, { en: string; ja: string; color: string }>;
  newsCategories: string[];
}

export function NewsPageClient({ news, categoryLabels, newsCategories }: Props) {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const texts = {
    backToHome: { en: 'Back to Home', ja: 'ホームに戻る' },
    updates: { en: 'Updates', ja: '更新情報' },
    news: { en: 'News', ja: 'ニュース' },
    description: {
      en: 'Stay updated with our latest research publications, awards, events, and announcements.',
      ja: '最新の研究発表、受賞、イベント、お知らせをお届けします。'
    },
    untitled: { en: 'Untitled', ja: 'タイトルなし' },
    noResults: {
      en: 'No news items found for the selected filters.',
      ja: '選択したフィルターに一致するニュースが見つかりませんでした。'
    },
    stayConnected: { en: 'Stay Connected', ja: 'つながりを保つ' },
    followResearch: { en: 'Follow Our Research', ja: '研究をフォロー' },
    followDescription: {
      en: 'Follow our research progress and lab activities. Connect with us on YouTube or check back regularly for updates.',
      ja: '研究の進捗や研究室の活動をフォローしてください。YouTubeでつながるか、定期的にチェックしてください。'
    },
    youtubeChannel: { en: 'YouTube Channel', ja: 'YouTubeチャンネル' },
    all: { en: 'All', ja: 'すべて' },
    allYears: { en: 'All Years', ja: 'すべての年' },
    readMore: { en: 'Read more', ja: '詳細を見る' },
  };

  const years = useMemo(() => {
    const uniqueYears = [...new Set(news.map((n) => new Date(n.date).getFullYear()))].sort(
      (a, b) => b - a
    );
    return ['all', ...uniqueYears.map(String)];
  }, [news]);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesYear =
        selectedYear === 'all' ||
        new Date(item.date).getFullYear().toString() === selectedYear;
      return matchesCategory && matchesYear;
    });
  }, [news, selectedCategory, selectedYear]);

  const getCategoryLabel = (category: string) => {
    if (category === 'all') return t(texts.all);
    const label = categoryLabels[category];
    return label ? (language === 'en' ? label.en : label.ja) : category;
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <header className="pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            {t(texts.backToHome)}
          </Link>
          <p className="section-label">{t(texts.updates)}</p>
          <h1 className="mb-4">{t(texts.news)}</h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            {t(texts.description)}
          </p>
        </div>
      </header>

      {/* Filters */}
      <section className="py-4 border-y border-[var(--border)] bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-wrap gap-2">
              {newsCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm font-medium transition-all rounded ${selectedCategory === category
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                    }`}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 bg-[var(--bg-alt)] border border-[var(--border)] rounded text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <option value="all">{t(texts.allYears)}</option>
              {years.slice(1).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          {filteredNews.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-secondary)]">
                {t(texts.noResults)}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item) => (
                <article key={item.id} className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="tag">{getCategoryLabel(item.category)}</span>
                    <span className="text-sm text-[var(--text-muted)]">
                      {new Date(item.date).toLocaleDateString(language === 'en' ? 'en-US' : 'ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold mb-3 line-clamp-2">
                    {item.title ? t(item.title) : t(texts.untitled)}
                  </h2>

                  {item.excerpt && (
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-4">
                      {t(item.excerpt)}
                    </p>
                  )}

                  {item.title && (
                    <p className="text-xs text-[var(--text-muted)] jp line-clamp-1">
                      {language === 'en' ? item.title.ja : item.title.en}
                    </p>
                  )}

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
                    >
                      {t(texts.readMore)} →
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* YouTube CTA */}
      <section className="py-16 bg-[var(--bg-alt)] border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <p className="section-label">{t(texts.stayConnected)}</p>
            <h2 className="mb-4">{t(texts.followResearch)}</h2>
            <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">
              {t(texts.followDescription)}
            </p>
            <a
              href="https://www.youtube.com/channel/UCuuuZ4ewKDXA-FvTiO4HqNA"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              {t(texts.youtubeChannel)}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
