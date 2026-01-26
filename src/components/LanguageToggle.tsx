'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { language, toggleLanguage, t } = useLanguage();

  const ariaLabel = t({
    en: 'Switch to Japanese',
    ja: '英語に切り替え',
  });

  return (
    <button
      onClick={toggleLanguage}
      className={`
        px-3 py-1.5 text-sm font-medium
        border border-neutral-700 rounded-md
        bg-neutral-900/50 hover:bg-neutral-800
        text-neutral-300 hover:text-white
        transition-colors duration-200
        ${className}
      `}
      aria-label={ariaLabel}
    >
      {language === 'en' ? '日本語' : 'EN'}
    </button>
  );
}
