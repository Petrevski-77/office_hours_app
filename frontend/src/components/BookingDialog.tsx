import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { ApiError, api } from '../api';
import { downloadIcs } from '../lib/ics';
import { endTime, formatTime, localTimeZone, longDate } from '../lib/time';
import type { BookingForm, BookingResult, PublicSlot } from '../types';

interface Props {
  slot: PublicSlot | null; 
  onClose: () => void;
  onChanged: () => void; 
}

const emptyForm: BookingForm = { name: '', email: '', team: '', topic: '' };


export default function BookingDialog({ slot, onClose, onChanged }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (slot && !dialog.open) dialog.showModal();
    if (!slot && dialog.open) dialog.close();
    setResult(null);
    setError(null);
  }, [slot?.id]);

  const set = (field: keyof BookingForm) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm({ ...form, [field]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setBusy(true);
    setError(null);
    try {
      const booking = await api.book(slot.id, { ...form, timeZone: localTimeZone() });
      setResult(booking);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      
      if (err instanceof ApiError && err.status === 409) onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={ref} className="drawer" onClose={onClose} aria-labelledby="drawer-title">
      {slot && !result && (
        <form onSubmit={submit} className="drawer-body">
          <button type="button" className="close" onClick={onClose} aria-label="Close">×</button>
          <h2 id="drawer-title">Book this session</h2>
          <p className="when">
            {longDate(slot.startsAt)}, {formatTime(slot.startsAt)} to{' '}
            {endTime(slot.startsAt, slot.durationMinutes)}
            <span className="muted"> ({slot.durationMinutes} min)</span>
          </p>

          <label>
            Your name
            <input required minLength={2} maxLength={80} autoComplete="name"
              value={form.name} onChange={set('name')} />
          </label>
          <label>
            Work email
            <input required type="email" maxLength={120} autoComplete="email"
              value={form.email} onChange={set('email')} />
          </label>
          <label>
            Team or company
            <input required minLength={2} maxLength={80}
              value={form.team} onChange={set('team')} />
          </label>
          <label>
            What do you want to work on?
            <textarea required minLength={5} maxLength={500} rows={4}
              placeholder="For example: automating our weekly status report with AI"
              value={form.topic} onChange={set('topic')} />
            <span className="hint">{form.topic.length}/500</span>
          </label>

          {error && <p role="alert" className="error">{error}</p>}

          <div className="actions">
            <button className="primary" disabled={busy}>
              {busy ? 'Booking…' : `Book ${formatTime(slot.startsAt)}`}
            </button>
            {error && <button type="button" className="ghost" onClick={onClose}>Pick another time</button>}
          </div>
        </form>
      )}

      {slot && result && (
        <div className="drawer-body">
          <button type="button" className="close" onClick={onClose} aria-label="Close">×</button>
          <h2 id="drawer-title">You're booked, {result.name.split(' ')[0]}.</h2>
          <p className="when">
            {longDate(result.startsAt)}, {formatTime(result.startsAt)} to{' '}
            {endTime(result.startsAt, result.durationMinutes)}
          </p>

          <p className="confirmation">{result.confirmationMessage}</p>

          {result.prepQuestions && (
            <>
              <h3>Think about these before we meet</h3>
              <ul className="prep">
                {result.prepQuestions.map((q) => <li key={q}>{q}</li>)}
              </ul>
            </>
          )}
          {result.aiGenerated && <p className="hint">Message written by Gemini.</p>}

          <div className="actions">
            <button className="primary" onClick={() => downloadIcs(result)}>Add to calendar</button>
            <button className="ghost" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </dialog>
  );
}
