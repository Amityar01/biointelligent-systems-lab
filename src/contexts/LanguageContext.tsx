'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: <T extends { en: string; ja: string }>(text: T) => string;
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
  const t = <T extends { en: string; ja: string }>(text: T): string => {
    return text[language];
  };

  // Prevent hydration mismatch by rendering default during SSR
  const value: LanguageContextType = {
    language: mounted ? language : defaultLanguage,
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
