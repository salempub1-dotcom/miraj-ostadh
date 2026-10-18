'use client';
import { useMemo,useState } from 'react';
import { Plus,Trash2,CalendarDays } from 'lucide-react';
import { saveCurrentTimetableAction } from './timetable-actions';

type Slot={key:number;day:number;start:string;end:string;note:string};
type InitialSlot=Pick<Slot,'day'|'start'|'end'|'note'>;
const DAYS=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس'];

export default function CurrentTimetableForm({initialSlots,gradeName}:{initialSlots:InitialSlot[];gradeName:string}) {
  const [slots,setSlots]=useState<Slot[]>(()=>initialSlots.map((slot,index)=>({...slot,key:index+1})));
  const serialized=useMemo(()=>JSON.stringify(slots.map(({day,start,end,note})=>({day,start,end,note}))),[slots]);
  function change(key:number,patch:Partial<Slot>){setSlots(current=>current.map(item=>item.key===key?{...item,...patch}:item));}
  function add(){setSlots(current=>[...current,{key:Math.max(0,...current.map(item=>item.key))+1,day:0,start:'08:00',end:'08:45',note:''}]);}
  function remove(key:number){setSlots(current=>current.filter(item=>item.key!==key));}
  return <form action={saveCurrentTimetableAction} className="form-stack miraj-timetable-editor">
    <p className="muted-copy">الجدول خاص بـ{gradeName}. حدّد أيام الحصص وتوقيتها، وستظهر تلقائيًا في صفحة «يومي». ستبقى جداول المستويات السابقة محفوظة.</p>
    <input type="hidden" name="slots" value={serialized}/>
    <div className="slot-list">
      {slots.map((slot,index)=><div className="slot-row miraj-timetable-row" key={slot.key}>
        <div className="slot-number">{index+1}</div>
        <label><span>اليوم</span><select aria-label={`يوم الحصة ${index+1}`} value={slot.day} onChange={e=>change(slot.key,{day:Number(e.target.value)})}>
          {DAYS.map((name,i)=><option value={i} key={i}>{name}</option>)}
        </select></label>
        <label><span>من</span><input type="time" className="time-input" required value={slot.start} onChange={e=>change(slot.key,{start:e.target.value})}/></label>
        <label><span>إلى</span><input type="time" className="time-input" required value={slot.end} onChange={e=>change(slot.key,{end:e.target.value})}/></label>
        <label><span>المادة / ملاحظة</span><input type="text" maxLength={120} placeholder="مثل: لغة عربية" value={slot.note} onChange={e=>change(slot.key,{note:e.target.value})}/></label>
        <button className="icon-danger" type="button" aria-label={`حذف الحصة ${index+1}`} onClick={()=>remove(slot.key)}><Trash2 size={17}/></button>
      </div>)}
    </div>
    {!slots.length?<div className="info-strip"><CalendarDays size={17}/> لا توجد حصص محفوظة لهذا المستوى بعد. أضف حصصك الفعلية.</div>:null}
    <button className="secondary-btn add-slot" type="button" onClick={add} disabled={slots.length>=30}><Plus size={18}/> إضافة حصة</button>
    <button className="primary-btn" type="submit" disabled={!slots.length}>حفظ جدول {gradeName}</button>
  </form>;
}
