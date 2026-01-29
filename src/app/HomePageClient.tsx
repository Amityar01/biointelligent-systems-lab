'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Member, NewsItem, Book, YouTubeChannel, HomepageSettings, Publication } from '@/lib/content';

interface HomePageClientProps {
  members: Member[];
  totalMembersCount: number;
  publications: Publication[];
  news: NewsItem[];
  books: Book[];
  youtubeChannel: YouTubeChannel | null;
  settings: HomepageSettings | null;
}

export default function HomePageClient({
  members,
  totalMembersCount,
  publications,
  news,
  books,
  settings
}: HomePageClientProps) {
  const { t, language } = useLanguage();

  const recentPubs = publications.slice(0, 4);
  const recentNews = news.slice(0, 3);

  const newsCategoryLabels: Record<NewsItem['category'], { en: string; ja: string }> = {
    publication: { en: 'Publication', ja: '論文' },
    award: { en: 'Award', ja: '受賞' },
    event: { en: 'Event', ja: 'イベント' },
    media: { en: 'Media', ja: 'メディア' },
    announcement: { en: 'Announcement', ja: 'お知らせ' },
  };

  const formatText = (text: { en: string; ja: string }, vars: Record<string, string | number>) => {
    let result = t(text);
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(`{${key}}`, String(value));
    }
    return result;
  };

  const texts = {
    heroAffiliation: { en: 'University of Tokyo', ja: '東京大学' },
    heroTitle: { en: 'Reverse Engineering the Brain', ja: '脳を逆行設計する' },
    heroDescription: {
      en: 'We decode the algorithms of biological intelligence—from neural cultures to the human cortex—to build the next generation of brain-inspired systems.',
      ja: '神経培養からヒト大脳皮質まで、生物知能のアルゴリズムを解読し、次世代の脳着想システムを構築します。',
    },
    exploreResearch: { en: 'Explore Research', ja: '研究を見る' },
    meetTeam: { en: 'Meet the Team', ja: 'チームを見る' },

    researchLabel: { en: 'Research Areas', ja: '研究分野' },
    researchDesc: {
      en: 'From self-organizing cultures to clinical applications, we investigate how intelligence emerges across scales.',
      ja: '自己組織化する培養神経回路から臨床応用まで、スケールを跨いで知能の創発を探究します。',
    },
    exploreAllResearch: { en: 'View All Research', ja: '研究一覧を見る' },

    teamLabel: { en: 'Our Team', ja: '研究室メンバー' },
    teamDesc: {
      en: 'A multidisciplinary team of engineers and neuroscientists exploring the frontier of biological intelligence.',
      ja: '工学と神経科学を横断するチームで、生命知能のフロンティアを探究しています。',
    },
    viewAllMembers: { en: 'View All {count} Members', ja: '{count}名のメンバーを見る' },

    publicationsLabel: { en: 'Recent Publications', ja: '最近の業績' },
    publicationsDesc: {
      en: 'Our latest findings published in high-impact journals across neuroscience and engineering.',
      ja: '神経科学と工学の分野で、高インパクト誌を中心に成果を発表しています。',
    },
    viewPublicationList: { en: 'View All Publications', ja: '業績一覧を見る' },

    newsLabel: { en: 'Latest News', ja: 'ニュース' },
    newsArchive: { en: 'News Archive', ja: 'ニュース一覧' },

    booksLabel: { en: 'Books & Media', ja: '書籍・メディア' },
    mediaHub: { en: 'View All Media', ja: 'メディア一覧' },
    orderBook: { en: 'Order Book', ja: '購入する' },

    contactLabel: { en: 'Get in Touch', ja: 'お問い合わせ' },
    contactTitle: { en: 'Join Our Lab', ja: '研究室に参加する' },
    contactDesc: {
      en: 'We are constantly looking for curious minds—engineers, biologists, and physicists—to join our journey into the heart of the brain.',
      ja: '工学・生物学・物理学など、多様な好奇心あふれる仲間を募集しています。',
    },
    contactUs: { en: 'Contact Us', ja: 'お問い合わせ' },
  };

  // Get images from settings or use defaults
  const heroImage = settings?.hero_image || '/uploads/scraped/hero-banner.jpg';
  const researchImages = settings?.research_images || {
    cultures: { main: '/uploads/scraped/neuronal-culture.jpg' },
    auditory: { main: '/uploads/scraped/lab-visualization.jpg' },
    clinical: { main: '/uploads/scraped/ecog-electrode.jpg' },
  };

  const researchAreas = [
    {
      id: 'cultures',
      title: { en: 'Emergent Computing', ja: '創発計算' },
      desc: {
        en: 'We study how self-organizing neuronal networks perform computation, using living cultures as physical reservoirs.',
        ja: '自己組織化する培養神経ネットワークが計算を行う仕組みを研究し、生きた回路を物理リザバーとして活用します。',
      },
      tag: { en: 'In Vitro', ja: '培養' },
      image: researchImages.cultures.main,
    },
    {
      id: 'auditory',
      title: { en: 'Auditory Processing', ja: '聴覚情報処理' },
      desc: {
        en: 'We investigate neural coding in the auditory cortex, from basic sound representation to rhythm and prediction.',
        ja: '聴覚皮質における神経符号化を、基本的な音表現からリズム・予測まで幅広く研究します。',
      },
      tag: { en: 'In Vivo', ja: '生体' },
      image: researchImages.auditory.main,
    },
    {
      id: 'clinical',
      title: { en: 'Neuromodulation', ja: '神経変調' },
      desc: {
        en: 'We develop therapeutic approaches using vagus nerve stimulation and study neural dynamics in epilepsy.',
        ja: '迷走神経刺激（VNS）などの治療アプローチを開発し、てんかんにおける神経ダイナミクスを研究します。',
      },
      tag: { en: 'Clinical', ja: '臨床' },
      image: researchImages.clinical.main,
    },
  ];

  // Reveal-on-scroll
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal, .stagger-children'));
    if (elements.length === 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).classList.add('visible');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <header className="pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="reveal">
              <p className="section-label">{t(texts.heroAffiliation)}</p>
              <h1 className="mb-6">{t(texts.heroTitle)}</h1>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8 max-w-xl">
                {t(texts.heroDescription)}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/research" className="btn-primary">
                  {t(texts.exploreResearch)}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/members" className="btn-secondary">
                  {t(texts.meetTeam)}
                </Link>
              </div>
            </div>

            <div className="reveal">
              <div className="aspect-[4/3] relative rounded-lg overflow-hidden shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage}
                  alt="Lab research"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Research Areas */}
      <section className="py-16 lg:py-24 bg-[var(--bg-alt)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-12 reveal">
            <p className="section-label">{t(texts.researchLabel)}</p>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {t(texts.researchDesc)}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {researchAreas.map((area) => (
              <article key={area.id} className="card overflow-hidden reveal">
                <div className="aspect-[16/10] relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={area.image}
                    alt={t(area.title)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="tag mb-4">{t(area.tag)}</span>
                  <h3 className="text-xl mb-3">{t(area.title)}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {t(area.desc)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center reveal">
            <Link href="/research" className="btn-secondary">
              {t(texts.exploreAllResearch)}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="reveal">
              <p className="section-label">{t(texts.teamLabel)}</p>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
                {t(texts.teamDesc)}
              </p>
              <Link href="/members" className="btn-secondary">
                {formatText(texts.viewAllMembers, { count: totalMembersCount })}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 reveal">
              {members.slice(0, 2).map((member) => (
                <Link key={member.id} href={`/members/${member.id}`} className="group">
                  <div className="aspect-[3/4] relative rounded-lg overflow-hidden mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={member.image || '/uploads/scraped/placeholder.jpg'}
                      alt={t(member.name)}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs text-[var(--accent)] uppercase tracking-wide mb-1">
                    {t(member.role)}
                  </p>
                  <h3 className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                    {t(member.name)}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] jp">
                    {language === 'en' ? member.name.ja : member.name.en}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Publications */}
      <section className="py-16 lg:py-24 bg-[var(--bg-alt)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl reveal">
              <p className="section-label">{t(texts.publicationsLabel)}</p>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                {t(texts.publicationsDesc)}
              </p>
            </div>
            <Link href="/publications" className="btn-secondary whitespace-nowrap reveal">
              {t(texts.viewPublicationList)}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-1 reveal">
            {recentPubs.map((pub) => (
              <article
                key={pub.id}
                className="p-6 bg-white rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <span className="text-sm font-mono text-[var(--accent)] font-semibold shrink-0">
                    {pub.year}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text)] mb-2 leading-snug">
                      {pub.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">
                      {pub.authors.join(', ')}
                    </p>
                    <p className="text-sm text-[var(--text-muted)] italic">{pub.journal}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="reveal">
              <p className="section-label">{t(texts.newsLabel)}</p>
            </div>
            <Link href="/news" className="btn-secondary reveal">
              {t(texts.newsArchive)}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {recentNews.map((item) => (
              <article key={item.id} className="card p-6 reveal">
                <div className="flex items-center gap-3 mb-4">
                  <span className="tag">
                    {newsCategoryLabels[item.category]
                      ? t(newsCategoryLabels[item.category])
                      : item.category}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(item.date).toLocaleDateString(language === 'en' ? 'en-US' : 'ja-JP', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--text)] mb-3 leading-snug line-clamp-2">
                  {t(item.title)}
                </h3>
                {item.excerpt && (
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                    {t(item.excerpt)}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Books */}
      {books.length > 0 && (
        <section className="py-16 lg:py-24 bg-[var(--bg-alt)]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="reveal">
                <p className="section-label">{t(texts.booksLabel)}</p>
              </div>
              <Link href="/media" className="btn-secondary reveal">
                {t(texts.mediaHub)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {books.slice(0, 3).map((book) => (
                <article key={book.id} className="card p-6 reveal">
                  <div className="aspect-[3/4] mb-6 relative rounded overflow-hidden bg-[var(--bg-muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={book.image || '/uploads/scraped/life-intelligence-book.jpg'}
                      alt={t(book.title)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="tag">{book.year}</span>
                    <span className="text-xs text-[var(--text-muted)]">{t(book.publisher)}</span>
                  </div>
                  <h3 className="font-semibold text-[var(--text)] mb-2 leading-snug">
                    {t(book.title)}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4 jp">
                    {language === 'en' ? book.title.ja : book.title.en}
                  </p>
                  {book.amazon && (
                    <a
                      href={book.amazon}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
                    >
                      {t(texts.orderBook)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 text-center reveal">
          <p className="section-label">{t(texts.contactLabel)}</p>
          <h2 className="mb-6">{t(texts.contactTitle)}</h2>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
            {t(texts.contactDesc)}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn-primary">
              {t(texts.contactUs)}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/research" className="btn-secondary">
              {t(texts.exploreResearch)}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
