'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const navItems = [
  { href: '/research', label: { en: 'Research', ja: '研究' } },
  { href: '/members', label: { en: 'People', ja: 'メンバー' } },
  { href: '/publications', label: { en: 'Publications', ja: '業績' } },
  { href: '/news', label: { en: 'News', ja: 'ニュース' } },
  { href: '/contact', label: { en: 'Contact', ja: 'お問い合わせ' } },
];

export default function Footer() {
  const { t, language } = useLanguage();

  const texts = {
    labName: { en: 'Takahashi-Shiramatsu Laboratory', ja: '生命知能システム研究室' },
    labNameEnShort: { en: 'Takahashi-Shiramatsu Laboratory', ja: 'Takahashi-Shiramatsu Laboratory' },
    deptLines: {
      en: 'Department of Mechano-Informatics',
      ja: '機械情報学専攻',
    },
    schoolLines: {
      en: 'Graduate School of Information Science and Technology',
      ja: '情報理工学系研究科',
    },
    uniLine: { en: 'The University of Tokyo', ja: '東京大学' },
    links: { en: 'Links', ja: 'リンク' },
    contact: { en: 'Contact', ja: 'お問い合わせ' },
    addressEn: {
      en: 'Engineering Building No. 2\n7-3-1 Hongo, Bunkyo-ku\nTokyo 113-8656, Japan',
      ja: '工学部2号館\n〒113-8656 東京都文京区本郷7-3-1',
    },
    rights: {
      en: '© {year} Takahashi-Shiramatsu Laboratory, The University of Tokyo',
      ja: '© {year} Takahashi-Shiramatsu Laboratory, 東京大学',
    },
    youtube: { en: 'YouTube', ja: 'YouTube' },
  };

  const formatText = (text: { en: string; ja: string }, vars: Record<string, string | number>) => {
    let result = t(text);
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(`{${key}}`, String(value));
    }
    return result;
  };

  return (
    <footer className="py-12 border-t border-[var(--border)] bg-[var(--bg-alt)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="mb-4">
              <p className="font-semibold text-[var(--text)]">{t(texts.labNameEnShort)}</p>
              <p className="text-sm text-[var(--text-muted)] jp">{t(texts.labName)}</p>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {t(texts.deptLines)}<br />
              {t(texts.schoolLines)}<br />
              {t(texts.uniLine)}
            </p>
          </div>
          <div>
            <p className="font-medium text-[var(--text)] mb-4">{t(texts.links)}</p>
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  {t(item.label)}
                </Link>
              ))}
              <a
                href="https://www.youtube.com/channel/UCuuuZ4ewKDXA-FvTiO4HqNA"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                {t(texts.youtube)}
              </a>
            </div>
          </div>
          <div>
            <p className="font-medium text-[var(--text)] mb-4">{t(texts.contact)}</p>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
              {language === 'en' ? texts.addressEn.en : texts.addressEn.ja}
            </p>
            <a
              href="mailto:takahashi@i.u-tokyo.ac.jp"
              className="text-sm text-[var(--accent)] mt-3 block hover:underline"
            >
              takahashi@i.u-tokyo.ac.jp
            </a>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--border)] text-center">
          <p className="text-xs text-[var(--text-muted)]">
            {formatText(texts.rights, { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
