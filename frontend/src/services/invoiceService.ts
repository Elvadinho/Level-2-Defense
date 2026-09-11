import api from './api';
import { Invoice, CreateInvoiceData, InvoiceStatus } from '../types/finance';

export const invoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    const response = await api.get<Invoice[]>('/invoices');
    return response.data;
  },

  async getInvoice(id: number): Promise<Invoice> {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    const response = await api.post<Invoice>('/invoices', data);
    return response.data;
  },

  async updateStatus(id: number, status: InvoiceStatus): Promise<Invoice> {
    const response = await api.put<Invoice>(`/invoices/${id}`, { status });
    return response.data;
  },

  async updateInvoiceStatus(id: number, status: InvoiceStatus): Promise<Invoice> {
    return this.updateStatus(id, status);
  },

  async deleteInvoice(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/invoices/${id}`);
    return response.data;
  },
};
