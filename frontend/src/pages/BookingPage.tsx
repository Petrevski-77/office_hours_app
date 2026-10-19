import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import BookingDialog from '../components/BookingDialog';
import {
  dayNumber, formatTime, groupByDay, localTimeZone, monthName, weekday,
} from '../lib/time';
import type { PublicSlot } from '../types';

const REFRESH_MS = 20_000;

export default function BookingPage() {
  const [slots, setSlots] = useState<PublicSlot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicSlot | null>(null);

  const load = useCallback(async () => {
    try {
      setSlots(await api.listSlots());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load slots.');
    }
  }, []);

  
  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const days = useMemo(() => (slots ? groupByDay(slots) : []), [slots]);
  const open = slots?.filter((s) => !s.booked).length ?? 0;

  return (
    <>
      <section className="intro">
        <h1>Book time with a coach.</h1>
        <p>
          One-to-one sessions for AI champions. Pick a slot, tell us what you are
          working on, and get a few questions to think about beforehand.
        </p>
        {slots && slots.length > 0 && (
          <p className="muted">
            {open} available {open === 1 ? 'slot' : 'slots'}. Times are in your time zone ({localTimeZone()}).
          </p>
        )}
      </section>

      {error && <p role="alert" className="error">{error}</p>}
      {!slots && !error && <p className="muted">Loading slots…</p>}
      {slots && slots.length === 0 && (
        <p className="empty">Your coach has not published any times yet. Check back soon.</p>
      )}

      <div className="board">
        {days.map((day) => (
          <section key={day.key} className="day">
            <div className="day-label">
              <span className="day-number">{dayNumber(day.date)}</span>
              <span>
                <strong>{weekday(day.date)}</strong>
                <br />
                {monthName(day.date)}
              </span>
            </div>
            <ul className="slots">
              {day.items.map((slot) => (
                <li key={slot.id}>
                  <button
                    className={slot.booked ? 'slot booked' : 'slot'}
                    disabled={slot.booked}
                    onClick={() => setSelected(slot)}
                    aria-label={`${formatTime(slot.startsAt)}, ${slot.durationMinutes} minutes${slot.booked ? ', booked' : ''}`}
                  >
                    <span className="slot-time">{formatTime(slot.startsAt)}</span>
                    <span className="slot-meta">{slot.booked ? 'Booked' : `${slot.durationMinutes} min`}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <BookingDialog slot={selected} onClose={() => setSelected(null)} onChanged={load} />
    </>
  );
}
