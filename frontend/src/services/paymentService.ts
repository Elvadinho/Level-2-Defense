import api from './api';
import { Payment, InitiatePaymentData } from '../types/finance';

export const paymentService = {
  async getPayments(): Promise<Payment[]> {
    const response = await api.get<Payment[]>('/payments');
    return response.data;
  },

  async getPayment(id: number): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  async initiatePayment(data: InitiatePaymentData): Promise<Payment> {
    const response = await api.post<Payment>('/payments', data);
    return response.data;
  },

  async verifyPayment(id: number): Promise<Payment> {
    const response = await api.post<Payment>(`/payments/${id}/verify`);
    return response.data;
  },
};
