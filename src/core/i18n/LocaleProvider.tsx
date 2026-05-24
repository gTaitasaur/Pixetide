import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLocaleFromPath, type SupportedLocale } from '../seo/seoConfig';

const STORAGE_KEY = 'pixetide_locale';

type LocaleContextValue = {
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): SupportedLocale | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'es') return v;
  } catch {}
  return null;
}

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();

  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    return readStoredLocale() ?? getLocaleFromPath(pathname);
  });

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored) {
      setLocaleState(stored);
    } else {
      setLocaleState(getLocaleFromPath(pathname));
    }
  }, [pathname]);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(STORAGE_KEY, newLocale); } catch {}
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};

export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocaleContext must be used within LocaleProvider');
  return ctx;
}
