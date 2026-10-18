'use client';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light'|'dark'|'system';
const KEY = 'miraj-ostadh-theme';
function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>('system');
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    const current: Theme = saved === 'dark' || saved === 'light' ? saved : 'system';
    setTheme(current); applyTheme(current);
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => { if ((localStorage.getItem(KEY) ?? 'system') === 'system') applyTheme('system'); };
    query.addEventListener('change',update);
    return () => query.removeEventListener('change',update);
  }, []);
  function update(next: Theme) {setTheme(next);localStorage.setItem(KEY,next);applyTheme(next);}
  return <div className="miraj-theme-switch" role="group" aria-label="مظهر المنصة">
    <button type="button" onClick={()=>update('light')} aria-pressed={theme==='light'} title="الوضع النهاري"><Sun size={17}/></button>
    <button type="button" onClick={()=>update('dark')} aria-pressed={theme==='dark'} title="الوضع الليلي"><Moon size={17}/></button>
    <button type="button" onClick={()=>update('system')} aria-pressed={theme==='system'} title="حسب إعداد الجهاز"><Monitor size={17}/></button>
  </div>;
}
