'use client';

import Link from 'next/link';
import { NetworkGlyph } from '@/components/Glyphs';

const navItems = [
  { href: '/research', label: 'Research' },
  { href: '/members', label: 'People' },
  { href: '/publications', label: 'Publications' },
  { href: '/news', label: 'News' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="py-16 border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <NetworkGlyph color="var(--accent)" />
              <div>
                <p className="font-semibold text-[var(--text)]">Takahashi-Shiramatsu Laboratory</p>
                <p className="text-sm text-[var(--text-muted)] jp">生命知能システム研究室</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm">
              Department of Mechano-Informatics<br />
              Graduate School of Information Science and Technology<br />
              The University of Tokyo
            </p>
          </div>
          <div>
            <p className="font-medium text-[var(--text)] mb-4">Links</p>
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  {item.label}
                </Link>
              ))}
              <a
                href="https://www.youtube.com/channel/UCuuuZ4ewKDXA-FvTiO4HqNA"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
              >
                YouTube
              </a>
            </div>
          </div>
          <div>
            <p className="font-medium text-[var(--text)] mb-4">Contact</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Engineering Building No. 2<br />
              7-3-1 Hongo, Bunkyo-ku<br />
              Tokyo 113-8656, Japan
            </p>
            <a href="mailto:takahashi@i.u-tokyo.ac.jp" className="text-sm text-[var(--accent)] mt-3 block hover:underline">
              takahashi@i.u-tokyo.ac.jp
            </a>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Takahashi-Shiramatsu Laboratory, The University of Tokyo
          </p>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Life Intelligence Systems Lab
          </p>
        </div>
      </div>
    </footer>
  );
}
