import api from './api';
import { Payment, InitiatePaymentData } from '../types/finance';

export const paymentService = {
  async getPayments(): Promise<Payment[]> {
    const response = await api.get<Payment[]>('/payments');
    return response.data.map(normalizePayment);
  },

  async getPayment(id: number): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${id}`);
    return normalizePayment(response.data);
  },

  async initiatePayment(data: InitiatePaymentData): Promise<Payment> {
    const response = await api.post<Payment>('/payments', data);
    return normalizePayment(response.data);
  },

  async verifyPayment(id: number): Promise<Payment> {
    const response = await api.post<Payment>(`/payments/${id}/verify`);
    return normalizePayment(response.data);
  },
};

const normalizePayment = (payment: Payment): Payment => {
  const methodByChannel: Record<string, Payment['method']> = {
    'cm.orange': 'orange_money',
    'cm.mtn': 'mtn_momo',
    'cm.card': 'cm.card',
  };

  return {
    ...payment,
    method: payment.method || methodByChannel[payment.channel || ''] || 'card',
    status: (payment.status as string) === 'complete' ? 'completed' : (payment.status as string) === 'processing' ? 'pending' : payment.status,
    transaction_reference: payment.transaction_reference || (payment as Payment & { notchpay_reference?: string }).notchpay_reference,
  };
};
