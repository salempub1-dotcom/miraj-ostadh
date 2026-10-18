'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireCompletedTeacherContext } from '@/lib/auth';

type Slot = {day:number;start:string;end:string;note?:string};
const timeRe=/^([01]\d|2[0-3]):[0-5]\d$/;
const fail=(message:string):never=>redirect('/account?timetable_error='+encodeURIComponent(message)+'#my-timetable');

export async function saveCurrentTimetableAction(formData:FormData) {
  const {supabase}=await requireCompletedTeacherContext();
  const raw=formData.get('slots');
  if(typeof raw!=='string'||raw.length>12000) fail('بيانات الحصص غير صالحة.');
  let slots:Slot[];
  try {
    const parsed:unknown=JSON.parse(raw);
    if(!Array.isArray(parsed)||parsed.length<1||parsed.length>30) fail('أضف من 1 إلى 30 حصة.');
    slots=parsed as Slot[];
  }catch {fail('تعذر قراءة بيانات الجدول.');}
  for(const slot of slots){
    if(typeof slot!=='object'||slot===null||!Number.isInteger(slot.day)||slot.day<0||slot.day>4
      ||typeof slot.start!=='string'||typeof slot.end!=='string'
      ||!timeRe.test(slot.start)||!timeRe.test(slot.end)||slot.start>=slot.end
      ||typeof slot.note!=='string'||slot.note.length>120)
      fail('يرجى التأكد من صحة اليوم والتوقيت والمدة.');
  }
  const sorted=[...slots].sort((a,b)=>a.day-b.day||a.start.localeCompare(b.start));
  for(let i=1;i<sorted.length;i++){
    if(sorted[i].day===sorted[i-1].day&&sorted[i].start<sorted[i-1].end)
      fail('توجد حصص متداخلة في نفس اليوم.');
  }
  const {error}=await supabase.rpc('save_my_current_timetable',{p_slots:sorted});
  if(error) fail('تعذر حفظ الجدول، تأكد من عدم تداخل الحصص وحاول مجددًا.');
  revalidatePath('/', 'layout');
  redirect('/account?timetable_saved=1#my-timetable');
}
