import api from './api';
import { AttendanceRecord, CheckInPayload, CheckOutPayload } from '../types/attendance';

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

  async getQrCode(): Promise<string> {
    // Returns SVG text directly
    const response = await api.get<string>('/attendance/qr-code', {
      responseType: 'text',
    });
    return response.data;
  },

  async generateQrCode(): Promise<{ qr_svg: string }> {
    const qr_svg = await this.getQrCode();
    return { qr_svg };
  },
};
