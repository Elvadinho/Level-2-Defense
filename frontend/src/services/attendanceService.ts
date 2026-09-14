import api from './api';
import { AttendanceRecord, CheckInPayload, CheckOutPayload, QrKioskCode, QrKioskPeriod } from '../types/attendance';

export const attendanceService = {
  async checkIn(payload: CheckInPayload = {}): Promise<{ message: string; attendance: AttendanceRecord }> {
    const response = await api.post<{ message: string; attendance: AttendanceRecord }>(
      '/attendance/check-in',
      payload
    );
    return response.data;
  },

  async checkOut(payload: CheckOutPayload = {}): Promise<{ message: string; attendance: AttendanceRecord }> {
    const response = await api.post<{ message: string; attendance: AttendanceRecord }>(
      '/attendance/check-out',
      payload
    );
    return response.data;
  },

  async getMyHistory(): Promise<AttendanceRecord[]> {
    const response = await api.get<AttendanceRecord[]>('/attendance/my-history');
    return response.data;
  },

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    const response = await api.get<AttendanceRecord[]>('/attendance');
    return response.data;
  },

  async getEmployeeHistory(employeeId: number): Promise<AttendanceRecord[]> {
    const response = await api.get<AttendanceRecord[]>(`/attendance/history/${employeeId}`);
    return response.data;
  },

  async generateQrCode(period: QrKioskPeriod = 'day'): Promise<QrKioskCode> {
    // Returns SVG text directly, plus custom headers describing validity.
    const response = await api.get<string>('/attendance/qr-code', {
      params: { period },
      responseType: 'text',
    });
    return {
      svg: response.data,
      period: (response.headers['x-qr-period'] as QrKioskPeriod) || period,
      expiresAt: response.headers['x-qr-expires-at'] ?? null,
    };
  },
};
