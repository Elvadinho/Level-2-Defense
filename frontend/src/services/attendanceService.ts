import api from './api';
import { 
  AttendanceRecord, 
  CheckInPayload, 
  CheckOutPayload, 
  RemoteCheckInPayload,
  QrKioskCode, 
  QrKioskPeriod 
} from '../types/attendance';

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

  async requestRemoteCheckIn(payload: RemoteCheckInPayload): Promise<{ message: string; attendance: AttendanceRecord }> {
    const response = await api.post<{ message: string; attendance: AttendanceRecord }>(
      '/attendance/remote-check-in',
      payload
    );
    return response.data;
  },

  async getMyHistory(): Promise<AttendanceRecord[]> {
    const response = await api.get<AttendanceRecord[]>('/attendance/my-history');
    return response.data;
  },

  async getAllAttendance(employeeId?: number): Promise<AttendanceRecord[]> {
    const params: Record<string, string> = {};
    if (employeeId) {
      params.employee_id = String(employeeId);
    }
    const response = await api.get<AttendanceRecord[]>('/attendance', { params });
    return response.data;
  },

  async getEmployeeHistory(employeeId: number): Promise<AttendanceRecord[]> {
    const response = await api.get<AttendanceRecord[]>(`/attendance/history/${employeeId}`);
    return response.data;
  },
  
  async getRemoteRequests(): Promise<AttendanceRecord[]> {
    const response = await api.get<AttendanceRecord[]>('/attendance/remote-requests');
    return response.data;
  },

  async approveRemoteRequest(id: number): Promise<{ message: string; attendance: AttendanceRecord }> {
    const response = await api.post<{ message: string; attendance: AttendanceRecord }>(
      `/attendance/remote-requests/${id}/approve`
    );
    return response.data;
  },

  async rejectRemoteRequest(id: number, reason: string): Promise<{ message: string; attendance: AttendanceRecord }> {
    const response = await api.post<{ message: string; attendance: AttendanceRecord }>(
      `/attendance/remote-requests/${id}/reject`,
      { reason }
    );
    return response.data;
  },

  async toggleRemoteAuth(userId: number): Promise<{ message: string; remote_checkin_authorized: boolean }> {
    const response = await api.post<{ message: string; remote_checkin_authorized: boolean }>(
      `/attendance/toggle-remote-auth/${userId}`
    );
    return response.data;
  },

  async exportCsv(): Promise<void> {
    const response = await api.get('/attendance/export-csv', {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'attendance-export.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch.length === 2) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
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
