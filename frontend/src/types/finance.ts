import { User } from './auth';

export type CustomerType = 'individual' | 'company';
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'accepted' | 'declined' | 'rejected' | 'expired';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'orange_money' | 'mtn_momo' | 'card' | 'cm.card' | 'notchpay' | 'cash' | 'bank_transfer' | string;

export interface Customer {
  id: number;
  user_id?: number;
  name?: string;
  company_name?: string;
  contact_name?: string;
  email: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  type?: CustomerType;
  user?: User;
  created_at?: string;
  updated_at?: string;
}

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal?: number;
  total?: number;
}

export interface Quotation {
  id: number;
  customer_id: number;
  reference?: string;
  quotation_number?: string;
  quote_number?: string;
  status: QuotationStatus;
  subtotal?: number | string;
  tax?: number | string;
  total_amount: number | string;
  valid_until?: string;
  notes?: string;
  items?: QuotationItem[];
  customer?: Customer;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal?: number;
  total?: number;
}

export interface Invoice {
  id: number;
  customer_id: number;
  quotation_id?: number | null;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal?: number | string;
  tax?: number | string;
  total_amount: number | string;
  due_date: string;
  notes?: string;
  items?: InvoiceItem[];
  customer?: Customer;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  invoice_id?: number | null;
  customer_id?: number | null;
  reference?: string;
  transaction_reference?: string;
  notchpay_reference?: string;
  amount: number | string;
  currency?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  phone?: string;
  email?: string;
  description?: string;
  authorization_url?: string | null;
  paid_at?: string | null;
  invoice?: Invoice;
  customer?: Customer;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomerData {
  company_name?: string;
  contact_name: string;
  email: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  type?: CustomerType;
}

export interface CreateQuotationData {
  customer_id: number;
  valid_until?: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface CreateInvoiceData {
  customer_id: number;
  quotation_id?: number;
  due_date: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface InitiatePaymentData {
  invoice_id?: number;
  customer_id?: number;
  amount: number;
  currency?: string;
  method: 'orange_money' | 'mtn_momo' | 'card' | 'cm.card' | string;
  phone?: string;
  email?: string;
  description?: string;
}
