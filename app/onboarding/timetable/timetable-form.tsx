'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { saveTimetableAction } from './actions';

type Slot = {
  localId: number;
  day: number;
  start: string;
  end: string;
};

type InitialSlot = Omit<Slot, 'localId'>;

const days = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
];

export default function TimetableForm({ initialSlots }: { initialSlots: InitialSlot[] }) {
  const [slots, setSlots] = useState<Slot[]>(() =>
    (initialSlots.length ? initialSlots : [{ day: 0, start: '08:00', end: '08:45' }]).map((slot, index) => ({
      ...slot,
      localId: index + 1,
    })),
  );

  const serialized = useMemo(
    () => JSON.stringify(slots.map(({ day, start, end }) => ({ day, start, end }))),
    [slots],
  );

  function updateSlot(localId: number, patch: Partial<Slot>) {
    setSlots((current) => current.map((slot) => (slot.localId === localId ? { ...slot, ...patch } : slot)));
  }

  function addSlot() {
    setSlots((current) => [
      ...current,
      {
        localId: Math.max(0, ...current.map((slot) => slot.localId)) + 1,
        day: 0,
        start: '08:00',
        end: '08:45',
      },
    ]);
  }

  function removeSlot(localId: number) {
    setSlots((current) => current.filter((slot) => slot.localId !== localId));
  }

  return (
    <form action={saveTimetableAction} className="form-stack onboarding-form">
      <input type="hidden" name="slots" value={serialized} />

      <div className="slot-list">
        {slots.map((slot, index) => (
          <div className="slot-row" key={slot.localId}>
            <div className="slot-number">{index + 1}</div>
            <label>
              <span>اليوم</span>
              <select value={slot.day} onChange={(event) => updateSlot(slot.localId, { day: Number(event.target.value) })}>
                {days.map((day) => <option value={day.value} key={day.value}>{day.label}</option>)}
              </select>
            </label>
            <label>
              <span>من</span>
              <input className="time-input" type="time" value={slot.start} onChange={(event) => updateSlot(slot.localId, { start: event.target.value })} />
            </label>
            <label>
              <span>إلى</span>
              <input className="time-input" type="time" value={slot.end} onChange={(event) => updateSlot(slot.localId, { end: event.target.value })} />
            </label>
            <button className="icon-danger" type="button" aria-label="حذف الحصة" onClick={() => removeSlot(slot.localId)}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button className="secondary-btn add-slot" type="button" onClick={addSlot}>
        <Plus size={18} /> إضافة حصة
      </button>
      <button className="primary-btn wide" type="submit">حفظ الجدول والمتابعة</button>
    </form>
  );
}
