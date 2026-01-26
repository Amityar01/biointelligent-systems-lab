'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BilingualText {
  en: string;
  ja: string;
}

interface Finding {
  title: BilingualText;
  desc: BilingualText;
  paper: string;
}

interface ResearchArea {
  id: string;
  scale: BilingualText;
  color: string;
  title: BilingualText;
  question: BilingualText;
  image: string;
  description: BilingualText;
  findings: Finding[];
  topics: BilingualText[];
}

interface Methodology {
  title: BilingualText;
  desc: BilingualText;
  detail: BilingualText;
}

interface Props {
  researchAreas: ResearchArea[];
  methodologies: Methodology[];
}

export default function ResearchPageClient({ researchAreas, methodologies }: Props) {
  const { t, language } = useLanguage();

  const texts = {
    backToHome: { en: 'Back to Home', ja: 'ホームに戻る' },
    whatWeStudy: { en: 'What We Study', ja: '研究テーマ' },
    heroTitle1: { en: 'Three Scales,', ja: '4つのスケールで' },
    heroTitle2: { en: 'One Question', ja: '1つの問いへ' },
    heroDesc: {
      en: 'We approach the brain at multiple scales—from neurons in a dish to human clinical studies. Each scale reveals different aspects of how neural computation emerges, processes information, and can be modulated.',
      ja: '培養神経回路からヒト臨床研究まで、複数のスケールで脳にアプローチします。それぞれのスケールが、神経計算の創発・情報処理・変調の異なる側面を明らかにします。',
    },
    researchTopics: { en: 'Research Topics', ja: '研究トピック' },
    keyFindings: { en: 'Key Findings', ja: '主な成果' },

    philosophy: { en: 'Philosophy', ja: '理念' },
    philosophyQuote: {
      en: '"We aim to reverse engineer the brain—to understand what \'function\' a brain\'s structure and neural activity patterns represent as a \'design solution.\'"',
      ja: '「脳を逆行設計し、脳の構造と神経活動パターンがどのような“機能”を“設計解”として表しているのかを理解する。」',
    },
    philosophyBody: {
      en: 'Unlike AI which automates existing rules, biological intelligence creates new rules. We seek to understand this difference through experiment and theory.',
      ja: 'AIが既存のルールを“自動化”するのに対し、生物の知能は新しいルールを“創発”します。私たちは実験と理論の両輪で、その違いを解き明かします。',
    },

    methodsLabel: { en: 'Methods', ja: '手法' },
    methodsTitle: { en: 'How We Work', ja: '研究アプローチ' },
    methodsDesc: {
      en: 'We combine cutting-edge recording technology with rigorous theoretical analysis to understand neural computation.',
      ja: '最先端の計測技術と厳密な理論解析を組み合わせ、神経計算を理解します。',
    },

    globalNetwork: { en: 'Global Network', ja: '国際連携' },
    collaborationsTitle: { en: 'International Collaborations', ja: '国際共同研究' },
    collaborationsDesc: {
      en: 'We work with leading researchers worldwide, particularly in neural recording technology and computational neuroscience.',
      ja: '神経計測技術と計算神経科学を中心に、世界の第一線の研究者と共同研究を進めています。',
    },
    ctaCollab: { en: 'Interested in Collaboration?', ja: '共同研究のご相談' },
  };

  const collaborations = [
    {
      name: 'ETH Zurich',
      desc: {
        en: 'CMOS array development (Hierlemann, Bakkum)',
        ja: 'CMOSアレイ開発（Hierlemann, Bakkum）',
      },
    },
    {
      name: 'Maxwell Biosystems',
      desc: {
        en: 'High-density recording technology',
        ja: '高密度記録技術',
      },
    },
    {
      name: 'Monash University',
      desc: {
        en: 'Consciousness and neural coding',
        ja: '意識と神経符号化',
      },
    },
    {
      name: 'Jichi Medical University',
      desc: {
        en: 'VNS clinical studies',
        ja: 'VNSの臨床研究',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero */}
      <header className="pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            {t(texts.backToHome)}
          </Link>
          <p className="section-label">{t(texts.whatWeStudy)}</p>
          <h1 className="mb-4">
            <span className="text-[var(--text)]">{t(texts.heroTitle1)}</span>{' '}
            <span className="text-[var(--accent)]">{t(texts.heroTitle2)}</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            {t(texts.heroDesc)}
          </p>
        </div>
      </header>

      {/* Research Areas */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="space-y-32">
            {researchAreas.map((area) => (
              <div key={area.id} id={area.id} className="scroll-mt-24">
                {/* Scale indicator */}
                <div className="flex items-center gap-4 mb-8">
                  <span className={`tag tag-${area.id === 'emergence' ? 'cultures' : area.id}`}>
                    {t(area.scale)}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                  {/* Main content */}
                  <div className="lg:col-span-7">
                    <p
                      className={[
                        'text-sm text-[var(--text-muted)] mb-2',
                        language === 'en' ? 'jp' : '',
                      ].join(' ')}
                    >
                      {language === 'en' ? area.title.ja : area.title.en}
                    </p>
                    <h2 className="text-3xl lg:text-4xl font-semibold mb-4">{t(area.title)}</h2>
                    <p className="text-lg mb-6" style={{ color: area.color }}>
                      {t(area.question)}
                    </p>
                    <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
                      {t(area.description)}
                    </p>

                    {/* Research image */}
                    <div className="aspect-[16/9] relative overflow-hidden border border-[var(--border)] mb-8">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={area.image}
                        alt={t(area.title)}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Topics */}
                    <div className="mb-8">
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4">{t(texts.researchTopics)}</p>
                      <div className="flex flex-wrap gap-2">
                        {area.topics.map((topic) => (
                          <span key={`${area.id}-${topic.en}`} className="tag">
                            {t(topic)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Findings */}
                  <div className="lg:col-span-5">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-4">{t(texts.keyFindings)}</p>
                    <div className="space-y-4">
                      {area.findings.map((finding) => (
                        <div
                          key={`${area.id}-${finding.paper}-${finding.title.en}`}
                          className="p-6 border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                        >
                          <h3 className="font-semibold mb-2">{t(finding.title)}</h3>
                          <p className="text-sm text-[var(--text-secondary)] mb-3">{t(finding.desc)}</p>
                          <p className="text-xs text-[var(--text-muted)]" style={{ color: area.color }}>{finding.paper}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Philosophy */}
      <section className="py-20 border-y border-[var(--border)] bg-[var(--bg-alt)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="section-label">{t(texts.philosophy)}</p>
            <blockquote className="pullquote mb-6">{t(texts.philosophyQuote)}</blockquote>
            <p className="text-[var(--text-secondary)]">{t(texts.philosophyBody)}</p>
          </div>
        </div>
      </section>

      {/* Methodologies */}
      <section className="py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <p className="section-label">{t(texts.methodsLabel)}</p>
            <h2 className="mb-4">{t(texts.methodsTitle)}</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl">{t(texts.methodsDesc)}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {methodologies.map((method) => (
              <div key={method.title.en} className="card p-6">
                <h3 className="text-lg font-semibold mb-2">{t(method.title)}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{t(method.desc)}</p>
                <p className="text-xs text-[var(--text-muted)]">{t(method.detail)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaborations */}
      <section className="py-20 lg:py-32 bg-[var(--bg-alt)] border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="section-label">{t(texts.globalNetwork)}</p>
              <h2 className="mb-6">{t(texts.collaborationsTitle)}</h2>
              <p className="text-[var(--text-secondary)] mb-6">{t(texts.collaborationsDesc)}</p>
              <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
                {collaborations.map((item) => (
                  <li key={item.name} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2" />
                    <span>
                      <strong className="text-[var(--text)]">{item.name}</strong> — {t(item.desc)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <Link href="/contact" className="btn-primary">
                {t(texts.ctaCollab)}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

