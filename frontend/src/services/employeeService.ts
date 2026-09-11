import api from './api';
import {
  Employee,
  Department,
  CreateEmployeeData,
  UpdateEmployeeData,
} from '../types/employee';

export const employeeService = {
  // Employee Endpoints
  async getEmployees(): Promise<Employee[]> {
    const response = await api.get<Employee[]>('/employees');
    return response.data;
  },

  async getEmployee(id: number): Promise<Employee> {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    const response = await api.post<Employee>('/employees', data);
    return response.data;
  },

  async updateEmployee(id: number, data: UpdateEmployeeData): Promise<Employee> {
    const response = await api.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/employees/${id}`);
    return response.data;
  },

  // Department Endpoints
  async getDepartments(): Promise<Department[]> {
    const response = await api.get<Department[]>('/departments');
    return response.data;
  },

  async createDepartment(data: { name: string; description?: string }): Promise<Department> {
    const response = await api.post<Department>('/departments', data);
    return response.data;
  },

  async deleteDepartment(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/departments/${id}`);
    return response.data;
  },
};
