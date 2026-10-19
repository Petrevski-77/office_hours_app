export const localTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

const timeFmt = new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' });

export const formatTime = (iso: string): string => timeFmt.format(new Date(iso));

export const endTime = (iso: string, minutes: number): string =>
  timeFmt.format(new Date(new Date(iso).getTime() + minutes * 60_000));

export interface DayGroup<T> {
  key: string; 
  date: Date;
  items: T[];
}


export function groupByDay<T extends { startsAt: string }>(items: T[]): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const item of items) {
    const date = new Date(item.startsAt);
    const key = date.toLocaleDateString('en-CA'); 
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, date, items: [item] });
  }
  return groups;
}

export const weekday = (d: Date): string =>
  d.toLocaleDateString('en-GB', { weekday: 'long' });

export const dayNumber = (d: Date): string => String(d.getDate());

export const monthName = (d: Date): string =>
  d.toLocaleDateString('en-GB', { month: 'long' });

export const longDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });


export const toDateInput = (d: Date): string => d.toLocaleDateString('en-CA');


export const localToIso = (date: string, time: string): string =>
  new Date(`${date}T${time}`).toISOString();
