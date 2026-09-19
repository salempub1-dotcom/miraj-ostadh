import type { Metadata } from 'next';
import './globals.css';
import './flow.css';
import './teacher-pages.css';
import './v2.css';
import './lesson-v2.css';
import './v2-polish.css';
import './v2-2.css';

export const metadata: Metadata = {
  title: 'معراج الأستاذ',
  description: 'مكتب الأستاذ الرقمي للتعليم الابتدائي',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
