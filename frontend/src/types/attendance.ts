import { Employee } from './employee';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  location?: string;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  status: AttendanceStatus;
  notes?: string;
  employee?: Employee;
  created_at?: string;
  updated_at?: string;
}

export interface CheckInPayload {
  latitude?: number;
  longitude?: number;
  qr_code?: string;
}

export interface CheckOutPayload {
  latitude?: number;
  longitude?: number;
}
