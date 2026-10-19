import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, api } from '../api';
import {
  dayNumber, endTime, formatTime, groupByDay, localToIso, monthName, toDateInput, weekday,
} from '../lib/time';
import type { HostSlot } from '../types';

const KEY_STORAGE = 'office-hours-host-key';


const readKey = (): string | null => {
  try { return sessionStorage.getItem(KEY_STORAGE); } catch { return null; }
};
const writeKey = (key: string | null) => {
  try {
    if (key) sessionStorage.setItem(KEY_STORAGE, key);
    else sessionStorage.removeItem(KEY_STORAGE);
  } catch { }
};

export default function HostPage() {
  const [key, setKey] = useState<string | null>(readKey);

  const signOut = () => { writeKey(null); setKey(null); };
  const signIn = (k: string) => { writeKey(k); setKey(k); };

  return key ? <Dashboard hostKey={key} onSignOut={signOut} /> : <Gate onSignIn={signIn} />;
}



function Gate({ onSignIn }: { onSignIn: (key: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.hostOverview(value); 
      onSignIn(value);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401
        ? 'That password is not right.'
        : err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="gate">
      <h1>Coach view</h1>
      <p className="muted">Enter the password to publish slots and see who booked.</p>
      <label>
        Password
        <input type="password" required autoFocus value={value}
          onChange={(e) => setValue(e.target.value)} />
      </label>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="actions">
        <button className="primary" disabled={busy}>{busy ? 'Checking…' : 'Open coach view'}</button>
      </div>
    </form>
  );
}



function Dashboard({ hostKey, onSignOut }: { hostKey: string; onSignOut: () => void }) {
  const [slots, setSlots] = useState<HostSlot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toDateInput(tomorrow);
  });
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [count, setCount] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const [formMessage, setFormMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setSlots(await api.hostOverview(hostKey));
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onSignOut();
      setError(err instanceof Error ? err.message : 'Could not load slots.');
    }
  }, [hostKey, onSignOut]);

  useEffect(() => { load(); }, [load]);

  async function publish(e: FormEvent) {
    e.preventDefault();
    setPublishing(true);
    setFormMessage(null);
    try {
      const created = await api.createSlots(hostKey, {
        startsAt: localToIso(date, time),
        durationMinutes: duration,
        count,
      });
      setFormMessage({ ok: true, text: `Published ${created.length} ${created.length === 1 ? 'slot' : 'slots'}.` });
      await load();
    } catch (err) {
      setFormMessage({ ok: false, text: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setPublishing(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.deleteSlot(hostKey, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the slot.');
    }
  }

  
  const upcoming = useMemo(
    () => (slots ?? []).filter((s) => new Date(s.startsAt).getTime() + s.durationMinutes * 60_000 > Date.now()),
    [slots],
  );
  const days = useMemo(() => groupByDay(upcoming), [upcoming]);
  const booked = upcoming.filter((s) => s.booking).length;

  return (
    <div className="host">
      <aside>
        <h1>Coach view</h1>
        <form onSubmit={publish} className="publish">
          <h2>Publish slots</h2>
          <label>Date
            <input type="date" required value={date} min={toDateInput(new Date())}
              onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>Start time
            <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label>Length
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </label>
          <label>How many, back to back
            <input type="number" min={1} max={8} value={count}
              onChange={(e) => setCount(Math.min(8, Math.max(1, Number(e.target.value) || 1)))} />
          </label>
          {formMessage && (
            <p role={formMessage.ok ? 'status' : 'alert'} className={formMessage.ok ? 'success' : 'error'}>
              {formMessage.text}
            </p>
          )}
          <div className="actions">
            <button className="primary" disabled={publishing}>{publishing ? 'Publishing…' : 'Publish'}</button>
          </div>
        </form>
        <button className="ghost small" onClick={onSignOut}>Sign out</button>
      </aside>

      <section>
        <h2>Upcoming sessions</h2>
        {slots && <p className="muted">{booked} booked, {upcoming.length - booked} available.</p>}
        {error && <p role="alert" className="error">{error}</p>}
        {slots && upcoming.length === 0 && (
          <p className="empty">Nothing is published yet. Use the form to add your first slots.</p>
        )}

        {days.map((day) => (
          <div key={day.key} className="day host-day">
            <div className="day-label">
              <span className="day-number">{dayNumber(day.date)}</span>
              <span><strong>{weekday(day.date)}</strong><br />{monthName(day.date)}</span>
            </div>
            <ul className="sessions">
              {day.items.map((s) => (
                <li key={s.id} className={s.booking ? 'session booked-session' : 'session'}>
                  <div className="session-head">
                    <strong>{formatTime(s.startsAt)} to {endTime(s.startsAt, s.durationMinutes)}</strong>
                    {s.booking
                      ? <span className="tag">Booked</span>
                      : <button className="ghost small" onClick={() => remove(s.id)}>Remove</button>}
                  </div>
                  {s.booking && (
                    <div className="attendee">
                      <p>
                        {s.booking.name} from {s.booking.team}{' '}
                        <a href={`mailto:${s.booking.email}`}>{s.booking.email}</a>
                      </p>
                      <p className="topic">{s.booking.topic}</p>
                      {s.booking.prepQuestions && (
                        <details>
                          <summary>Prep questions for {s.booking.name.split(" ")[0]}</summary>
                          <ul className="prep">
                            {s.booking.prepQuestions.map((q) => <li key={q}>{q}</li>)}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
