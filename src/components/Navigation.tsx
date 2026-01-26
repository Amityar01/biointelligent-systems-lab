'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const navItems = [
  { href: '/', label: { en: 'Home', ja: 'ホーム' } },
  { href: '/research', label: { en: 'Research', ja: '研究' } },
  { href: '/members', label: { en: 'People', ja: 'メンバー' } },
  { href: '/publications', label: { en: 'Publications', ja: '業績' } },
  { href: '/news', label: { en: 'News', ja: 'ニュース' } },
  { href: '/contact', label: { en: 'Contact', ja: 'アクセス' } },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when pathname changes
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      setIsOpen(false);
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-sm border-b border-[var(--border)] shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex flex-col">
                <span className="font-semibold text-[var(--text)] text-[15px] sm:text-base">
                  Takahashi-Shiramatsu Lab
                </span>
                <span className="text-xs sm:text-sm text-[var(--text-muted)] hidden sm:block">
                  University of Tokyo
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                >
                  {t(item.label)}
                </Link>
              ))}
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="text-sm text-[var(--text-muted)] font-medium hover:text-[var(--accent)] transition-colors px-2 py-1 rounded"
              >
                {language === 'en' ? '日本語' : 'EN'}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded text-[var(--text)] hover:bg-[var(--bg-muted)] transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white border-l border-[var(--border)] p-6 pt-24 shadow-lg">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block py-4 px-5 rounded-lg text-xl font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-[var(--accent)] bg-[var(--bg-muted)]'
                      : 'text-[var(--text)] hover:text-[var(--accent)] hover:bg-[var(--bg-muted)]'
                  }`}
                >
                  {t(item.label)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
