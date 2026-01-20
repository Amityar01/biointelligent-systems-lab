'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { NetworkGlyph } from '@/components/Glyphs';
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
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      setIsOpen(false);
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]' : 'bg-transparent'
          }`}
      >
        <nav className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 relative glass-pill flex items-center justify-center group-hover:scale-110 transition-transform">
                <NetworkGlyph color="var(--accent)" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[var(--text)] tracking-tight leading-none text-sm lg:text-base">
                  Takahashi-Shiramatsu
                </span>
                <span className="text-[10px] text-[var(--accent)] font-mono uppercase tracking-widest mt-1 opacity-80">
                  Biointelligent Systems Lab
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
            <div className="flex items-center gap-6">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="text-xs text-[var(--text-muted)] font-mono hover:text-[var(--accent)] transition-colors"
              >
                {language === 'en' ? '日本語' : 'EN'}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-lg text-[var(--text)] hover:bg-[var(--accent)]/10 transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-[var(--bg)]/95 backdrop-blur-xl"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm border-l border-[var(--border)] p-8 pt-24"
            >
              <div className="flex flex-col gap-4">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className={`block py-4 text-2xl font-bold transition-all ${pathname === item.href
                        ? 'text-[var(--accent)] border-l-2 border-[var(--accent)] pl-6'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)] pl-6'
                        }`}
                    >
                      {t(item.label)}
                    </Link>
                  </motion.div>
                ))}

                <div className="mt-12 pt-12 border-t border-[var(--border)]">
                  <Link href="/contact" className="btn-primary w-full justify-center">
                    Let&apos;s Connect
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
