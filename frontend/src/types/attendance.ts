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
  work_hours?: string | null;
  location?: string;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  check_in_distance?: number | null;
  check_out_distance?: number | null;
  check_in_ip?: string | null;
  check_out_ip?: string | null;
  fraud_flag?: boolean;
  fraud_reason?: string | null;
  status: AttendanceStatus;
  notes?: string;
  
  // Remote Check-in Fields
  is_remote?: boolean;
  remote_reason?: string | null;
  remote_status?: 'pending' | 'approved' | 'rejected' | null;
  remote_approved_by?: number | null;
  remote_rejection_reason?: string | null;
  approver?: { id: number; name: string } | null;

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
  qr_code?: string;
}

export interface RemoteCheckInPayload {
  reason: string;
  latitude?: number;
  longitude?: number;
}

export type QrKioskPeriod = 'day' | 'week' | 'month';

export interface QrKioskCode {
  svg: string;
  period: QrKioskPeriod;
  expiresAt: string | null;
}
