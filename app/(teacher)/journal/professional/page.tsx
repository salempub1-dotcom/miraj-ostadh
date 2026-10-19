import { requireCompletedTeacherContext } from '@/lib/auth';
import { JournalSectionNav } from '../JournalSectionNav';
import { saveRegisterRecord, removeRegisterRecord } from '../register-actions';
export default async function ProfessionalLogPage({searchParams}:{searchParams:Promise<{saved?:string,error?:string}>}){
 const {supabase,context}=await requireCompletedTeacherContext();const params=await searchParams;
 const {data:records,error}=await supabase.from('teacher_register_records').select('id,record_type,event_date,title,place,notes')
 .eq('teacher_context_id',context.id).in('record_type',['inspection','training','visit']).order('event_date',{ascending:false});
 if(error)return <div role="alert">تعذر تحميل السجل المهني.</div>;
 const names:Record<string,string>={inspection:'زيارة تفتيش',training:'تربص أو تكوين',visit:'زيارة تربوية'};
 return <main className="register-home"><div className="register-section-head"><h1>التفتيش والتربصات</h1><p>سجل الزيارات المهنية والتفتيش والتكوين: الموضوع والتاريخ والمكان والملاحظات.</p></div>
 <JournalSectionNav active="/journal/professional"/>
 {params.saved&&<p className="miraj-journal-message" role="status">تمت إضافة السجل المهني.</p>}
 {params.error&&<p className="miraj-journal-message error" role="alert">تعذر حفظ السجل. تحقق من المدخلات.</p>}
 <section className="register-panel"><h2>إضافة نشاط مهني</h2>
 <form action={saveRegisterRecord} className="register-form">
 <label>النوع<select name="record_type"><option value="inspection">تفتيش</option><option value="training">تربص / تكوين</option><option value="visit">زيارة تربوية</option></select></label>
 <label>التاريخ<input type="date" name="event_date"/></label>
 <label className="wide">موضوع الزيارة أو التكوين<input name="title" required maxLength={180}/></label>
 <label>مكان النشاط<input name="place" maxLength={180}/></label>
 <label className="wide">الملاحظات<textarea name="notes" rows={3} maxLength={2000}/></label>
 <button className="register-submit" type="submit">حفظ النشاط</button>
 </form></section>
 <section className="register-panel"><h2>السجل المهني ({records?.length??0})</h2>
 {!records?.length?<p className="register-empty">لم تضف أي زيارة أو تربص بعد.</p>:<div className="register-records">{records.map(r=>
 <article className="register-record" key={r.id}><div><small>{names[r.record_type]} · {r.event_date??'دون تاريخ'}</small><h3>{r.title}</h3><p>{r.place?('المكان: '+r.place):''}</p><p>{r.notes}</p><details className="register-record-editor"><summary>تعديل السجل</summary><form action={saveRegisterRecord} className="register-form">
   <input type="hidden" name="id" value={r.id}/><input type="hidden" name="record_type" value={r.record_type}/>
   <label>التاريخ<input type="date" name="event_date" defaultValue={r.event_date??''}/></label>
   <label>المكان<input name="place" maxLength={180} defaultValue={r.place??''}/></label>
   <label className="wide">الموضوع<input name="title" required maxLength={180} defaultValue={r.title}/></label>
   <label className="wide">ملاحظات<textarea name="notes" maxLength={2000} rows={2} defaultValue={r.notes??''}/></label>
   <button type="submit" className="register-submit">حفظ التعديل</button></form></details></div>
 <form action={removeRegisterRecord}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="section" value="professional"/><button className="register-danger" type="submit">حذف</button></form>
 </article>)}</div>}</section></main>;
}
