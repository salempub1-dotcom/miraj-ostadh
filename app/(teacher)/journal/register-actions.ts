'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireCompletedTeacherContext } from '@/lib/auth';

const safe = (value: FormDataEntryValue|null,max:number) => String(value??'').trim().slice(0,max+1);
const go=(route:string,reason:string):never=>redirect('/journal/'+route+'?error='+reason);
const datePattern=/^\d{4}-\d{2}-\d{2}$/;

export async function saveClassPupil(formData:FormData) {
 const {supabase,context}=await requireCompletedTeacherContext();
 const id=safe(formData.get('id'),40), full_name=safe(formData.get('full_name'),140), observations=safe(formData.get('observations'),1200);
 const order_index=Number(formData.get('order_index'));
 if (!full_name||full_name.length>140||observations.length>1200||!Number.isInteger(order_index)||order_index<1||order_index>99) go('students','invalid');
 const row={teacher_context_id:context.id,full_name,observations:observations||null,order_index};
 const {error}=id
  ? await supabase.from('teacher_class_pupils').update(row).eq('id',id).eq('teacher_context_id',context.id)
  : await supabase.from('teacher_class_pupils').insert(row);
 if(error) go('students','save');
 revalidatePath('/journal/students');revalidatePath('/journal');redirect('/journal/students?saved=1');
}
export async function removeClassPupil(formData:FormData) {
 const {supabase,context}=await requireCompletedTeacherContext();
 const id=safe(formData.get('id'),40);
 if(id) await supabase.from('teacher_class_pupils').delete().eq('id',id).eq('teacher_context_id',context.id);
 revalidatePath('/journal/students');revalidatePath('/journal');redirect('/journal/students');
}
export async function saveRegisterRecord(formData:FormData) {
 const {supabase,context}=await requireCompletedTeacherContext();
 const record_type=safe(formData.get('record_type'),30);
 const section=['holiday','occasion'].includes(record_type)?'calendar':'professional';
 if(!['holiday','occasion','inspection','training','visit'].includes(record_type)) go('calendar','invalid');
 const title=safe(formData.get('title'),180),notes=safe(formData.get('notes'),2000),
       place=safe(formData.get('place'),180),event_date=safe(formData.get('event_date'),10);
 if(!title||title.length>180||notes.length>2000||place.length>180||
   (event_date&&(!datePattern.test(event_date)||Number.isNaN(Date.parse(event_date+'T12:00:00Z'))||
    new Date(event_date+'T12:00:00Z').toISOString().slice(0,10)!==event_date))) go(section,'invalid');
 const id=safe(formData.get('id'),40);
 const values={teacher_context_id:context.id,record_type,title,event_date:event_date||null,place:place||null,notes:notes||null};
 const {error}=id
  ? await supabase.from('teacher_register_records').update(values).eq('id',id).eq('teacher_context_id',context.id)
  : await supabase.from('teacher_register_records').insert(values);
 if(error)go(section,'save');
 revalidatePath('/journal/'+section);revalidatePath('/journal');redirect('/journal/'+section+'?saved=1');
}
export async function removeRegisterRecord(formData:FormData) {
 const {supabase,context}=await requireCompletedTeacherContext();
 const id=safe(formData.get('id'),40);
 const section=safe(formData.get('section'),20)==='professional'?'professional':'calendar';
 if(id) await supabase.from('teacher_register_records').delete().eq('id',id).eq('teacher_context_id',context.id);
 revalidatePath('/journal/'+section);revalidatePath('/journal');redirect('/journal/'+section);
}
