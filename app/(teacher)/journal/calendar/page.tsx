import { requireCompletedTeacherContext } from '@/lib/auth';
import { JournalSectionNav } from '../JournalSectionNav';
import { saveRegisterRecord, removeRegisterRecord } from '../register-actions';
export default async function CalendarPage({searchParams}:{searchParams:Promise<{saved?:string,error?:string}>}){
 const {supabase,context}=await requireCompletedTeacherContext();const params=await searchParams;
 const {data:records,error}=await supabase.from('teacher_register_records').select('id,record_type,event_date,title,place,notes')
 .eq('teacher_context_id',context.id).in('record_type',['holiday','occasion']).order('event_date',{ascending:true});
 if(error)return <div role="alert">تعذر تحميل الرزنامة.</div>;
 return <main className="register-home"><div className="register-section-head"><h1>الرزنامة المدرسية</h1><p>العطل والمناسبات الوطنية والدينية والتواريخ المهمة. يمكنك تسجيلها وتعديلها دون المساس بالمرجع الأصلي.</p></div>
 <JournalSectionNav active="/journal/calendar"/>
 <p className="register-reference-note">تواريخ العطل الرسمية لسنة 2026–2027 غير مثبتة من الملفات القديمة؛ أدخل فقط التواريخ التي تحققت منها.</p>
 {params.saved&&<p className="miraj-journal-message" role="status">تم تسجيل الموعد.</p>}
 {params.error&&<p className="miraj-journal-message error" role="alert">تعذر حفظ الموعد؛ تحقق من المعلومات.</p>}
 <section className="register-panel"><h2>إضافة عطلة أو مناسبة</h2><form action={saveRegisterRecord} className="register-form">
 <label>نوع المناسبة<select name="record_type"><option value="holiday">عطلة مدرسية</option><option value="occasion">مناسبة دينية أو وطنية</option></select></label>
 <label>التاريخ<input type="date" name="event_date"/></label>
 <label className="wide">العنوان<input name="title" maxLength={180} required placeholder="عنوان المناسبة أو العطلة"/></label>
 <label className="wide">ملاحظات<textarea name="notes" rows={2} maxLength={2000}/></label>
 <button className="register-submit" type="submit">إضافة إلى الرزنامة</button></form></section>
 <section className="register-panel"><h2>المناسبات المسجلة ({records?.length??0})</h2>
 {!records?.length?<p className="register-empty">لا توجد مناسبات محفوظة حتى الآن.</p>:<div className="register-records">{records.map(r=>
  <article className="register-record" key={r.id}><div><small>{r.record_type==='holiday'?'عطلة مدرسية':'مناسبة دينية أو وطنية'} · {r.event_date??'دون تاريخ'}</small><h3>{r.title}</h3><p>{r.notes}</p><details className="register-record-editor"><summary>تعديل الموعد</summary><form action={saveRegisterRecord} className="register-form">
   <input type="hidden" name="id" value={r.id}/><input type="hidden" name="record_type" value={r.record_type}/>
   <label>التاريخ<input type="date" name="event_date" defaultValue={r.event_date??''}/></label>
   <label className="wide">العنوان<input name="title" required maxLength={180} defaultValue={r.title}/></label>
   <label className="wide">ملاحظات<textarea name="notes" maxLength={2000} rows={2} defaultValue={r.notes??''}/></label>
   <button type="submit" className="register-submit">حفظ التعديل</button></form></details></div>
  <form action={removeRegisterRecord}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="section" value="calendar"/><button className="register-danger" type="submit">حذف</button></form>
  </article>)}</div>}</section></main>;
}
