import { longDate } from './time';

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');


export function downloadIcs(opts: {
  id: string;
  startsAt: string;
  durationMinutes: number;
  topic: string;
}) {
  const start = new Date(opts.startsAt);
  const end = new Date(start.getTime() + opts.durationMinutes * 60_000);
  const summary = 'AI Coaching Office Hours';
  const description = `Topic: ${opts.topic}`.replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Office Hours//EN',
    'BEGIN:VEVENT',
    `UID:${opts.id}@office-hours`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `office-hours-${longDate(opts.startsAt).replace(/\W+/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
