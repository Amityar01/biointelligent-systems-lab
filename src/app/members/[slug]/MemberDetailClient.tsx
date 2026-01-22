'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Member } from '@/lib/content';

interface Props {
  member: Member;
}

export function MemberDetailClient({ member }: Props) {
  const { t, language } = useLanguage();

  const texts = {
    backToMembers: { en: 'Back to Members', ja: 'メンバー一覧に戻る' },
    memberProfile: { en: 'Member Profile', ja: 'メンバープロフィール' },
    about: { en: 'About', ja: '概要' },
    education: { en: 'Education', ja: '学歴' },
    researchInterests: { en: 'Research Interests', ja: '研究分野' },
    awards: { en: 'Awards', ja: '受賞歴' },
    contact: { en: 'Contact', ja: '連絡先' },
    links: { en: 'Links', ja: 'リンク' },
  };

  const categoryLabels: Record<string, { en: string; ja: string }> = {
    faculty: { en: 'Faculty', ja: '教員' },
    staff: { en: 'Staff', ja: '職員' },
    students: { en: 'Graduate Student', ja: '大学院生' },
    undergraduates: { en: 'Undergraduate', ja: '学部生' },
    visitors: { en: 'Visiting Researcher', ja: '客員研究員' },
    alumni: { en: 'Alumni', ja: '卒業生' },
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="grid-overlay" />

      {/* Hero */}
      <header className="pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Link href="/members" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t(texts.backToMembers)}
          </Link>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Photo */}
            <div className="lg:col-span-3">
              <div className="w-full max-w-[250px] aspect-[3/4] bg-[var(--bg-muted)] overflow-hidden">
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={t(member.name)}
                    width={250}
                    height={333}
                    className="member-photo w-full h-full"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-[var(--text-muted)]">
                    {member.name.en.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="lg:col-span-9">
              <p className="section-label">{t(texts.memberProfile)}</p>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">{t(member.name)}</h1>
              <p className="text-xl text-[var(--text-muted)] jp mb-4">
                {language === 'en' ? member.name.ja : member.name.en}
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="tag">{t(member.role)}</span>
                <span className="tag">{t(categoryLabels[member.category])}</span>
              </div>

              {/* Contact */}
              <div className="flex items-center gap-6 flex-wrap">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    {member.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* About */}
      <section className="py-16 border-t border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">{t(texts.about)}</h2>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              {t(member.bio)}
            </p>
          </div>
        </div>
      </section>

      {/* Education */}
      {member.education && member.education.length > 0 && (
        <section className="py-16 bg-[var(--bg-alt)] border-y border-[var(--border)]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <h2 className="text-2xl font-bold mb-8">{t(texts.education)}</h2>
            <ul className="space-y-3 max-w-2xl">
              {member.education.map((edu, index) => {
                // Handle both string and object formats
                const eduText = typeof edu === 'string'
                  ? edu
                  : (edu as { year?: string; event?: string }).year && (edu as { year?: string; event?: string }).event
                    ? `${(edu as { year?: string; event?: string }).year} - ${(edu as { year?: string; event?: string }).event}`
                    : String(edu);
                return (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
                    <span className="text-[var(--text-secondary)]">{eduText}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Research Interests */}
      {member.research && member.research.length > 0 && (
        <section className="py-16">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <h2 className="text-2xl font-bold mb-8">{t(texts.researchInterests)}</h2>
            <div className="flex flex-wrap gap-3">
              {member.research.map((topic, index) => (
                <span key={index} className="tag text-base px-4 py-2">{topic}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Awards */}
      {member.awards && member.awards.length > 0 && (
        <section className="py-16 bg-[var(--bg-alt)] border-y border-[var(--border)]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <h2 className="text-2xl font-bold mb-8">{t(texts.awards)}</h2>
            <ul className="space-y-3 max-w-2xl">
              {member.awards.map((award, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
                  <span className="text-[var(--text-secondary)]">{award}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Links */}
      {member.links && Object.keys(member.links).some(k => member.links?.[k as keyof typeof member.links]) && (
        <section className="py-16">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <h2 className="text-2xl font-bold mb-8">{t(texts.links)}</h2>
            <div className="flex flex-wrap gap-4">
              {member.links.researchmap && (
                <a
                  href={member.links.researchmap}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  researchmap
                </a>
              )}
              {member.links.googleScholar && (
                <a
                  href={member.links.googleScholar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Google Scholar
                </a>
              )}
              {member.links.orcid && (
                <a
                  href={member.links.orcid}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  ORCID
                </a>
              )}
              {member.links.website && (
                <a
                  href={member.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {language === 'en' ? 'Personal Website' : '個人サイト'}
                </a>
              )}
              {member.links.loop && (
                <a
                  href={member.links.loop}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Loop
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Personal Page Content (if available) */}
      {member.personalPageContent && (
        <section className="py-16 bg-[var(--bg-alt)] border-t border-[var(--border)]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="prose prose-invert max-w-3xl">
              <div dangerouslySetInnerHTML={{ __html: member.personalPageContent }} />
            </div>
          </div>
        </section>
      )}

      {/* Back link */}
      <section className="py-16 border-t border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <Link href="/members" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t(texts.backToMembers)}
          </Link>
        </div>
      </section>
    </div>
  );
}
