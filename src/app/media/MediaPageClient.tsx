'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, BookOpen, Youtube, Newspaper, Radio, Tv, Globe, Mic } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Book, MediaAppearance, YouTubeChannel, Serialization } from '@/lib/content';

const typeIcons: Record<string, React.ReactNode> = {
  tv: <Tv className="w-4 h-4" />,
  radio: <Radio className="w-4 h-4" />,
  newspaper: <Newspaper className="w-4 h-4" />,
  magazine: <BookOpen className="w-4 h-4" />,
  online: <Globe className="w-4 h-4" />,
  international: <Globe className="w-4 h-4" />,
};

const typeLabels: Record<string, { en: string; ja: string }> = {
  tv: { en: 'TV', ja: 'テレビ' },
  radio: { en: 'Radio', ja: 'ラジオ' },
  newspaper: { en: 'Newspaper', ja: '新聞' },
  magazine: { en: 'Magazine', ja: '雑誌' },
  online: { en: 'Online', ja: 'オンライン' },
  international: { en: 'International', ja: '国際' },
};

interface Props {
  books: Book[];
  mediaAppearances: MediaAppearance[];
  youtubeChannel: YouTubeChannel | null;
  serializations: Serialization[];
}

export function MediaPageClient({ books, mediaAppearances, youtubeChannel, serializations }: Props) {
  const { t, language } = useLanguage();

  const texts = {
    backToHome: { en: 'Back to Home', ja: 'ホームに戻る' },
    outreach: { en: 'Outreach', ja: 'アウトリーチ' },
    booksAndMedia: { en: 'Books & Media', ja: '書籍・メディア' },
    description: {
      en: 'Publications, media appearances, and public outreach activities sharing our research with wider audiences.',
      ja: '研究成果を広く発信する出版物、メディア出演、アウトリーチ活動。'
    },
    books: { en: 'Books', ja: '書籍' },
    youtubeChannel: { en: 'YouTube Channel', ja: 'YouTubeチャンネル' },
    visitChannel: { en: 'Visit Channel', ja: 'チャンネルを見る' },
    videoExplanations: { en: 'Video explanations of research', ja: '研究の動画解説' },
    brainScienceLectures: { en: 'and brain science lectures', ja: '脳科学講義' },
    magazineSerializations: { en: 'Magazine Serializations', ja: '雑誌連載' },
    mediaAppearances: { en: 'Media Appearances', ja: 'メディア出演' },
    viewArticle: { en: 'View Article', ja: '記事を見る' },
    amazon: { en: 'Amazon', ja: 'Amazon' },
    publisher: { en: 'Publisher', ja: '出版社' },
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="grid-overlay" />

      {/* Hero */}
      <header className="pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t(texts.backToHome)}
          </Link>
          <p className="section-label">{t(texts.outreach)}</p>
          <h1 className="mb-6">{t(texts.booksAndMedia)}</h1>
          <p className="text-xl lg:text-2xl text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            {t(texts.description)}
          </p>
        </div>
      </header>

      {/* Books Section */}
      <section className="py-16 border-t border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-6 h-6 text-[var(--accent)]" />
            <h2 className="text-2xl font-bold">{t(texts.books)}</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <article key={book.id} className="card p-6 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="tag">{book.year}</span>
                    <span className="text-sm text-[var(--text-muted)]">{t(book.publisher)}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 leading-snug">{t(book.title)}</h3>
                  <p className="text-sm text-[var(--text-muted)] jp mb-3">
                    {language === 'en' ? book.title.ja : book.title.en}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">{t(book.description)}</p>
                </div>
                <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--border)]">
                  {book.amazon && (
                    <a
                      href={book.amazon}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                    >
                      {t(texts.amazon)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {book.publisher_url && (
                    <a
                      href={book.publisher_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                    >
                      {t(texts.publisher)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* YouTube Section */}
      {youtubeChannel && (
        <section className="py-16 bg-[var(--bg-alt)] border-y border-[var(--border)]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Youtube className="w-6 h-6 text-red-500" />
                  <h2 className="text-2xl font-bold">{t(texts.youtubeChannel)}</h2>
                </div>
                <h3 className="text-xl mb-2">{t(youtubeChannel.name)}</h3>
                <p className="text-sm text-[var(--text-muted)] jp mb-4">
                  {language === 'en' ? youtubeChannel.name.ja : youtubeChannel.name.en}
                </p>
                <p className="text-[var(--text-secondary)] mb-6">{t(youtubeChannel.description)}</p>
                <a
                  href={youtubeChannel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {t(texts.visitChannel)}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="aspect-video bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center">
                <div className="text-center">
                  <Youtube className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-[var(--text-muted)]">{t(texts.videoExplanations)}</p>
                  <p className="text-sm text-[var(--text-muted)]">{t(texts.brainScienceLectures)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Serializations Section */}
      {serializations.length > 0 && (
        <section className="py-16 border-b border-[var(--border)]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="flex items-center gap-3 mb-8">
              <Mic className="w-6 h-6 text-[var(--accent)]" />
              <h2 className="text-2xl font-bold">{t(texts.magazineSerializations)}</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {serializations.map((series) => (
                <article key={series.id} className="card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="tag">{series.period}</span>
                    <span className="text-sm text-[var(--text-muted)]">{t(series.publication)}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t(series.title)}</h3>
                  <p className="text-sm text-[var(--text-muted)] jp mb-3">
                    {language === 'en' ? series.title.ja : series.title.en}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">{t(series.description)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Media Appearances Section */}
      <section className="py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-3 mb-8">
            <Newspaper className="w-6 h-6 text-[var(--accent)]" />
            <h2 className="text-2xl font-bold">{t(texts.mediaAppearances)}</h2>
          </div>

          <div className="space-y-0">
            {mediaAppearances.map((appearance) => (
              <article
                key={appearance.id}
                className="py-6 border-b border-[var(--border)] first:pt-0 last:border-0"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex items-center gap-3 lg:w-48 flex-shrink-0">
                    <span className="text-[var(--text-muted)]">
                      {typeIcons[appearance.type]}
                    </span>
                    <span className="tag text-xs">
                      {typeLabels[appearance.type] ? t(typeLabels[appearance.type]) : appearance.type}
                    </span>
                    <span className="text-sm text-[var(--text-muted)] font-mono">
                      {appearance.date}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{t(appearance.title)}</h3>
                    <p className="text-sm text-[var(--text-muted)] mb-2">{appearance.outlet}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{t(appearance.description)}</p>
                    {appearance.link && (
                      <a
                        href={appearance.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline mt-2"
                      >
                        {t(texts.viewArticle)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
