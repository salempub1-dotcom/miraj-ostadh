import { requireCompletedTeacherContext } from '@/lib/auth';
import { JournalSectionNav } from '../JournalSectionNav';
import { saveClassPupil,removeClassPupil } from '../register-actions';
export default async function StudentsPage({searchParams}:{searchParams:Promise<{saved?:string,error?:string}>}){
 const {supabase,context}=await requireCompletedTeacherContext();const params=await searchParams;
 const {data:students,error}=await supabase.from('teacher_class_pupils').select('id,full_name,order_index,observations')
  .eq('teacher_context_id',context.id).order('order_index');
 if(error)return <section className="register-home"><p role="alert">تعذر قراءة قائمة التلاميذ.</p></section>;
 const used=new Set((students??[]).map(s=>s.order_index));
 const next=Array.from({length:99},(_,i)=>i+1).find(n=>!used.has(n))??99;
 return <main className="register-home">
  <div className="register-section-head"><h1>قوائم التلاميذ</h1><p>قائمة اسمية وملاحظات القسم الحالي فقط. لا يتم نسخ التلاميذ من الملفات الورقية القديمة.</p></div>
  <JournalSectionNav active="/journal/students"/>
  {params.saved&&<p className="miraj-journal-message" role="status">تم حفظ التلميذ.</p>}
  {params.error&&<p className="miraj-journal-message error" role="alert">تعذر حفظ المعلومات؛ تحقق من رقم الترتيب أو من تكراره.</p>}
  <section className="register-panel"><h2>إضافة تلميذ</h2>
   <form action={saveClassPupil} className="register-form">
    <label>الرقم<input type="number" name="order_index" min={1} max={99} required defaultValue={next}/></label>
    <label>اسم التلميذ ولقبه<input name="full_name" maxLength={140} required placeholder="اسم ولقب التلميذ"/></label>
    <label className="wide">ملاحظات اختيارية<textarea name="observations" maxLength={1200} rows={2}/></label>
    <button className="register-submit" type="submit">إضافة إلى القائمة</button>
   </form>
  </section>
  <section className="register-panel"><div className="register-title-row"><h2>قائمة القسم</h2><strong>{students?.length??0} تلميذ</strong></div>
   {!students?.length?<p className="register-empty">القائمة فارغة. ابدأ بإضافة التلاميذ.</p>:
    <div className="register-student-list">{students.map(s=><details className="register-student" key={s.id}>
     <summary><b>{s.order_index.toString().padStart(2,'0')}</b><strong>{s.full_name}</strong><span>تعديل <span aria-hidden="true">⌄</span></span></summary>
     <form action={saveClassPupil} className="register-form">
      <input type="hidden" name="id" value={s.id}/>
      <label>الرقم<input type="number" name="order_index" min={1} max={99} required defaultValue={s.order_index}/></label>
      <label>الاسم واللقب<input name="full_name" maxLength={140} required defaultValue={s.full_name}/></label>
      <label className="wide">الملاحظات<textarea name="observations" maxLength={1200} rows={2} defaultValue={s.observations??''}/></label>
      <button className="register-submit" type="submit">حفظ التعديلات</button>
     </form>
     <form action={removeClassPupil}><input type="hidden" name="id" value={s.id}/><button className="register-danger" type="submit">حذف التلميذ</button></form>
    </details>)}</div>}
  </section>
 </main>;
}
