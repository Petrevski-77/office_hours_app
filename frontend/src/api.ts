import type {
  BookingForm,
  BookingResult,
  HostSlot,
  PublicSlot,
} from './types';


const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  hostKey?: string,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(hostKey ? { 'x-host-key': hostKey } : {}),
      },
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    
    const message = Array.isArray(data?.message)
      ? data.message.join('. ')
      : data?.message ?? 'Something went wrong. Please try again.';
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  listSlots: () => request<PublicSlot[]>('/slots'),

  book: (slotId: string, form: BookingForm & { timeZone: string }) =>
    request<BookingResult>(`/slots/${slotId}/book`, {
      method: 'POST',
      body: JSON.stringify(form),
    }),

  hostOverview: (key: string) =>
    request<HostSlot[]>('/host/overview', {}, key),

  createSlots: (
    key: string,
    body: { startsAt: string; durationMinutes: number; count: number },
  ) =>
    request<HostSlot[]>(
      '/host/slots',
      { method: 'POST', body: JSON.stringify(body) },
      key,
    ),

  deleteSlot: (key: string, id: string) =>
    request<{ deleted: boolean }>(`/host/slots/${id}`, { method: 'DELETE' }, key),
};
