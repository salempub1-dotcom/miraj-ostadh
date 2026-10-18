'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Preference = 'light' | 'dark' | 'system';
const KEY = 'miraj-ostadh-theme';

function setTheme(value: Preference) {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = value === 'system' ? (systemDark ? 'dark' : 'light') : value;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Preference>('system');
  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    const preference: Preference = stored === 'dark' || stored === 'light' ? stored : 'system';
    setTheme(preference);
    const frame = window.requestAnimationFrame(() => setMode(preference));
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => { if (window.localStorage.getItem(KEY) !== 'light' && window.localStorage.getItem(KEY) !== 'dark') setTheme('system'); };
    media.addEventListener('change', listener);
    return () => { window.cancelAnimationFrame(frame); media.removeEventListener('change', listener); };
  }, []);
  const cycle = () => {
    const next = mode === 'system' ? 'dark' : mode === 'dark' ? 'light' : 'system';
    window.localStorage.setItem(KEY, next);
    setMode(next);
    setTheme(next);
  };
  return (
    <button className="miraj-theme-toggle" type="button" onClick={cycle}
      aria-label={`المظهر الحالي: ${mode === 'dark' ? 'ليلي' : mode === 'light' ? 'نهاري' : 'تلقائي'}؛ اضغط للتغيير`}
      title="تبديل المظهر: تلقائي، ليلي، نهاري">
      {mode === 'dark' ? <Moon size={18}/> : <Sun size={18}/>}
      <span>المظهر: {mode === 'dark' ? 'ليلي' : mode === 'light' ? 'نهاري' : 'تلقائي'}</span>
    </button>
  );
}
