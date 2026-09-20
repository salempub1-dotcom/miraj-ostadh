import type { Metadata } from 'next';
import './globals.css';
import './flow.css';
import './teacher-pages.css';
import './v2.css';
import './lesson-v2.css';
import './v2-polish.css';
import './v2-2.css';
import './planning-v2.css';
import './planning-progress.css';
import './today-v3.css';
import './today-v3-1.css';
import './quick-access-v4.css';
import './quick-access-assets-v4.css';
import './today-reference-v5.css';
import './today-reference-v6.css';
import './today-layout-v7.css';

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
