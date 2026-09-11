import api from './api';
import { Customer, CreateCustomerData } from '../types/finance';

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const response = await api.get<Customer[]>('/customers');
    return response.data;
  },

  async getCustomer(id: number): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    const response = await api.post<Customer>('/customers', data);
    return response.data;
  },

  async updateCustomer(id: number, data: Partial<CreateCustomerData>): Promise<Customer> {
    const response = await api.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomer(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/customers/${id}`);
    return response.data;
  },
};
