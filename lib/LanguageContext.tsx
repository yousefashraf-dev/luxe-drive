'use client';
import { createContext, useContext, useState, useEffect, useCallback, startTransition, ReactNode } from 'react';
import translations, { type Lang, type TranslationKeys } from './translations';

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: TranslationKeys;
  dir: 'rtl' | 'ltr';
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
    const saved = localStorage.getItem('joydrive_lang') as Lang | null;
    if (saved === 'ar' || saved === 'en') {
      startTransition(() => setLangState(saved));
    }
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try { localStorage.setItem('joydrive_lang', newLang); } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  }, [lang, setLang]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang, mounted]);

  const tValue = (translations[lang as keyof typeof translations] || translations['ar']) as TranslationKeys;
  if (typeof window !== 'undefined' && !tValue) { console.error('[LanguageContext] t is undefined! lang:', lang, 'translations keys:', Object.keys(translations)); }

  const value: LanguageContextType = {
    lang,
    setLang,
    toggleLang,
    t: tValue,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
