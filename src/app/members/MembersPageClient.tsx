'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Member } from '@/lib/content';

interface Props {
  faculty: Member[];
  staff: Member[];
  students: Member[];
  undergraduates: Member[];
  visitors: Member[];
  alumni: Member[];
}

export function MembersPageClient({ faculty, staff, students, undergraduates, visitors, alumni }: Props) {
  const { t, language } = useLanguage();

  const texts = {
    backToHome: { en: 'Back to Home', ja: 'ホームに戻る' },
    ourTeam: { en: 'Our Team', ja: '研究チーム' },
    people: { en: 'People', ja: 'メンバー' },
    description: {
      en: 'Our interdisciplinary team combines expertise in neuroscience, engineering, and computational methods to understand the brain.',
      ja: '神経科学、工学、計算手法の専門知識を組み合わせた学際的なチームで、脳の理解に取り組んでいます。'
    },
    leadership: { en: 'Leadership', ja: 'リーダーシップ' },
    facultyLabel: { en: 'Faculty', ja: '教員' },
    education: { en: 'Education', ja: '学歴' },
    researchInterests: { en: 'Research Interests', ja: '研究分野' },
    support: { en: 'Support', ja: 'サポート' },
    staffLabel: { en: 'Research & Technical Staff', ja: '研究員・技術職員' },
    graduateSchool: { en: 'Graduate School', ja: '大学院' },
    graduateStudents: { en: 'Graduate Students', ja: '大学院生' },
    members: { en: 'members', ja: '名' },
    undergradResearch: { en: 'Undergraduate Research', ja: '学部研究' },
    undergraduateStudents: { en: 'Undergraduate Students', ja: '学部生' },
    international: { en: 'International', ja: '国際' },
    visitingResearchers: { en: 'Visiting Researchers', ja: '客員研究員' },
    opportunities: { en: 'Opportunities', ja: '機会' },
    interestedInJoining: { en: 'Interested in Joining?', ja: '研究室への参加に興味がありますか？' },
    joinDescription: {
      en: 'We welcome students and researchers passionate about understanding the brain through engineering and computational approaches.',
      ja: '工学的・計算論的アプローチで脳を理解することに情熱を持つ学生・研究者を歓迎します。'
    },
    getInTouch: { en: 'Get in Touch', ja: 'お問い合わせ' },
    doctoralYear: { en: 'Doctoral Year', ja: '博士課程' },
    mastersYear: { en: "Master's Year", ja: '修士課程' },
  };

  const getLevelLabel = (level: string) => {
    const year = level.slice(1);
    if (level.startsWith('D')) {
      return language === 'en' ? `Doctoral Year ${year}` : `博士課程${year}年`;
    }
    return language === 'en' ? `Master's Year ${year}` : `修士課程${year}年`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <header className="pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t(texts.backToHome)}
          </Link>
          <p className="section-label">{t(texts.ourTeam)}</p>
          <h1 className="mb-6">{t(texts.people)}</h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            {t(texts.description)}
          </p>
        </div>
      </header>

      {/* Faculty */}
      <section className="py-16 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="section-label">{t(texts.leadership)}</p>
          <h2 className="mb-12">{t(texts.facultyLabel)}</h2>

          <div className="space-y-12">
            {faculty.map((member) => (
              <div key={member.id} className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                <div className="lg:col-span-3">
                  <Link href={`/members/${member.slug}`} className="block">
                    <div className="w-full max-w-[200px] aspect-[3/4] bg-[var(--bg-muted)] overflow-hidden">
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={t(member.name)}
                          width={200}
                          height={267}
                          className="member-photo w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[var(--text-muted)]">
                          {member.name.en.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>

                <div className="lg:col-span-9">
                  <Link href={`/members/${member.slug}`}>
                    <h3 className="text-2xl font-bold mb-1 hover:text-[var(--accent)] transition-colors">
                      {t(member.name)}
                    </h3>
                  </Link>
                  <p className="text-[var(--text-muted)] jp mb-2">
                    {language === 'en' ? member.name.ja : member.name.en}
                  </p>
                  <p className="tag mb-4">{t(member.role)}</p>
                  <p className="text-[var(--text-secondary)] mb-6 max-w-2xl">
                    {t(member.bio)}
                  </p>

                  {member.education && member.education.length > 0 && (
                    <div className="mb-6">
                      <p className="section-label mb-2">{t(texts.education)}</p>
                      <ul className="space-y-1">
                        {member.education.map((edu, index) => {
                          // Handle both string and object formats
                          const eduText = typeof edu === 'string'
                            ? edu
                            : (edu as { year?: string; event?: string }).year && (edu as { year?: string; event?: string }).event
                              ? `${(edu as { year?: string; event?: string }).year} - ${(edu as { year?: string; event?: string }).event}`
                              : String(edu);
                          return (
                            <li key={index} className="text-sm text-[var(--text-secondary)]">
                              {eduText}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {member.research && member.research.length > 0 && (
                    <div className="mb-6">
                      <p className="section-label mb-2">{t(texts.researchInterests)}</p>
                      <div className="flex flex-wrap gap-2">
                        {member.research.map((topic) => (
                          <span key={topic} className="tag">{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 flex-wrap">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
                      >
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </a>
                    )}
                    {member.links?.researchmap && (
                      <a
                        href={member.links.researchmap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)]"
                      >
                        <ExternalLink className="w-4 h-4" />
                        researchmap
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Staff */}
      <section className="py-16 bg-[var(--bg-alt)] border-y border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="section-label">{t(texts.support)}</p>
          <h2 className="mb-12">{t(texts.staffLabel)}</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((person) => (
              <Link key={person.id} href={`/members/${person.slug}`} className="block">
                <div className="p-6 bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
                  <h3 className="font-semibold mb-1">{t(person.name)}</h3>
                  <p className="text-xs text-[var(--text-muted)] jp mb-2">
                    {language === 'en' ? person.name.ja : person.name.en}
                  </p>
                  <p className="tag mb-3">{t(person.role)}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{t(person.bio)}</p>
                  {person.email && (
                    <p className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] mt-3">
                      <Mail className="w-3 h-3" />
                      {person.email}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Graduate Students */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="section-label">{t(texts.graduateSchool)}</p>
          <h2 className="mb-4">{t(texts.graduateStudents)}</h2>
          <p className="text-[var(--text-secondary)] mb-12">{students.length} {t(texts.members)}</p>

          {['D3', 'D2', 'D1', 'M2', 'M1'].map((level) => {
            const levelStudents = students.filter(s => s.role.en.includes(level));
            if (levelStudents.length === 0) return null;

            return (
              <div key={level} className="mb-10">
                <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                  {getLevelLabel(level)}
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {levelStudents.map((student) => (
                    <Link key={student.id} href={`/members/${student.slug}`}>
                      <div className="p-4 border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
                        <p className="font-medium">{t(student.name)}</p>
                        <p className="text-xs text-[var(--text-muted)] jp">
                          {language === 'en' ? student.name.ja : student.name.en}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-2">{t(student.bio)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Undergraduates */}
      <section className="py-16 bg-[var(--bg-alt)] border-y border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="section-label">{t(texts.undergradResearch)}</p>
          <h2 className="mb-12">{t(texts.undergraduateStudents)}</h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {undergraduates.map((student) => (
              <Link key={student.id} href={`/members/${student.slug}`}>
                <div className="p-4 bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
                  <p className="font-medium text-sm">{t(student.name)}</p>
                  <p className="text-xs text-[var(--text-muted)] jp">
                    {language === 'en' ? student.name.ja : student.name.en}
                  </p>
                  <p className="text-xs text-[var(--accent)] mt-1">{t(student.role)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Visitors */}
      {visitors.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <p className="section-label">{t(texts.international)}</p>
            <h2 className="mb-12">{t(texts.visitingResearchers)}</h2>

            <div className="grid md:grid-cols-3 gap-6">
              {visitors.map((visitor) => (
                <Link key={visitor.id} href={`/members/${visitor.slug}`}>
                  <div className="p-6 border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
                    <p className="font-semibold">{t(visitor.name)}</p>
                    <p className="text-xs text-[var(--text-muted)] jp">
                      {language === 'en' ? visitor.name.ja : visitor.name.en}
                    </p>
                    <p className="tag mt-2">{t(visitor.role)}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-3">{t(visitor.bio)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Join us CTA */}
      <section className="py-20 lg:py-32 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="section-label">{t(texts.opportunities)}</p>
            <h2 className="mb-6">{t(texts.interestedInJoining)}</h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              {t(texts.joinDescription)}
            </p>
            <Link href="/contact" className="btn-primary">
              {t(texts.getInTouch)}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
