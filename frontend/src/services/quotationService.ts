import api from './api';
import { Quotation, CreateQuotationData, QuotationStatus } from '../types/finance';

export const quotationService = {
  async getQuotations(): Promise<Quotation[]> {
    const response = await api.get<Quotation[]>('/quotations');
    return response.data;
  },

  async getQuotation(id: number): Promise<Quotation> {
    const response = await api.get<Quotation>(`/quotations/${id}`);
    return response.data;
  },

  async createQuotation(data: CreateQuotationData): Promise<Quotation> {
    const response = await api.post<Quotation>('/quotations', data);
    return response.data;
  },

  async updateStatus(id: number, status: QuotationStatus): Promise<Quotation> {
    const response = await api.put<Quotation>(`/quotations/${id}`, { status });
    return response.data;
  },

  async updateQuotationStatus(id: number, status: QuotationStatus): Promise<Quotation> {
    return this.updateStatus(id, status);
  },

  async deleteQuotation(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/quotations/${id}`);
    return response.data;
  },
};
