export interface PublicSlot {
  id: string;
  startsAt: string; 
  durationMinutes: number;
  booked: boolean;
}

export interface BookingInfo {
  id: string;
  name: string;
  email: string;
  team: string;
  topic: string;
  confirmationMessage: string | null;
  prepQuestions: string[] | null;
  aiGenerated: boolean;
}

export interface HostSlot {
  id: string;
  startsAt: string;
  durationMinutes: number;
  booking: BookingInfo | null;
}

export interface BookingResult extends BookingInfo {
  slotId: string;
  startsAt: string;
  durationMinutes: number;
}

export interface BookingForm {
  name: string;
  email: string;
  team: string;
  topic: string;
}
