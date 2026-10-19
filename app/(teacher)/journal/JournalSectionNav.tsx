import Link from 'next/link';
import { BriefcaseBusiness, CalendarDays, CalendarRange, ClipboardList, NotebookPen, UsersRound } from 'lucide-react';
const sections=[
 {href:'/journal',label:'الرئيسية',icon:ClipboardList},
 {href:'/journal/profile',label:'بطاقتي',icon:BriefcaseBusiness},
 {href:'/journal/day',label:'الإعداد اليومي',icon:NotebookPen},
 {href:'/journal/students',label:'قوائم التلاميذ',icon:UsersRound},
 {href:'/journal/calendar',label:'الرزنامة',icon:CalendarDays},
 {href:'/journal/professional',label:'التفتيش والتربصات',icon:CalendarRange},
] as const;
export function JournalSectionNav({active}:{active:string}){
 return <nav className="register-tabs" aria-label="أقسام دفتري">
 {sections.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={active===href?'page':undefined}
 className={active===href?'selected':''}><Icon size={17}/><span>{label}</span></Link>)}
 </nav>;
}
export {sections};
