'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: <T extends { en: string; ja: string }>(text?: T | null) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'takahashi-lab-language';

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({ children, defaultLanguage = 'en' }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [mounted, setMounted] = useState(false);

  const effectiveLanguage = mounted ? language : defaultLanguage;

  // Load saved language preference on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && (saved === 'en' || saved === 'ja')) {
      setLanguageState(saved);
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ja')) {
        setLanguageState('ja');
      }
    }
  }, []);

  // Keep <html lang="..."> in sync for accessibility/SEO hints.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = effectiveLanguage;
    document.documentElement.dataset.lang = effectiveLanguage;
  }, [effectiveLanguage]);

  // Save language preference
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ja' : 'en';
    setLanguage(newLang);
  };

  // Translation helper - extracts the correct language from a bilingual object
  const t = <T extends { en: string; ja: string }>(text?: T | null): string => {
    if (!text) return '';
    const primary = text[effectiveLanguage];
    if (primary && primary.trim().length > 0) return primary;
    const fallbackLang: Language = effectiveLanguage === 'en' ? 'ja' : 'en';
    return text[fallbackLang] ?? '';
  };

  // Prevent hydration mismatch by rendering default during SSR
  const value: LanguageContextType = {
    language: effectiveLanguage,
    setLanguage,
    toggleLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Utility hook for getting text in current language
export function useText<T extends { en: string; ja: string }>(text: T): string {
  const { language } = useLanguage();
  return text[language];
}
