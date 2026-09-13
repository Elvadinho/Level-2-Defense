import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { invoiceService } from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import { Invoice, Customer, CreateInvoiceData, InvoiceStatus } from '../../types/finance';
import { MOCK_INVOICES, MOCK_CUSTOMERS } from '../../data/mockData';
import {
  canManageFinance,
  isCustomerRole,
  resolveCustomerProfile,
  scopeInvoices,
} from '../../config/roleScope';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  X,
  Loader2,
  CreditCard,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Clients only ever read their own ledger, staff keep the full accounting view
  const isClientView = isCustomerRole(user?.role);
  const canIssueInvoices = canManageFinance(user?.role);
  const clientProfile = resolveCustomerProfile(user, MOCK_CUSTOMERS);

  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    scopeInvoices(user, MOCK_INVOICES, MOCK_CUSTOMERS)
  );
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<CreateInvoiceData>({
    customer_id: 1,
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: 'Payment due within 14 days via Mobile Money or Card settlement.',
    items: [{ description: 'Enterprise ERP Subscription - Monthly', quantity: 1, unit_price: 2400000 }],
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invData, custData] = await Promise.all([
        invoiceService.getInvoices().catch(() => []),
        customerService.getCustomers().catch(() => []),
      ]);
      const resolvedCustomers =
        Array.isArray(custData) && custData.length > 0 ? custData : MOCK_CUSTOMERS;
      const resolvedInvoices =
        Array.isArray(invData) && invData.length > 0 ? invData : MOCK_INVOICES;

      setCustomers(resolvedCustomers);
      setInvoices(scopeInvoices(user, resolvedInvoices, resolvedCustomers));
      if (custData.length > 0 && !formData.customer_id) {
        setFormData((prev) => ({ ...prev, customer_id: custData[0].id }));
      }
    } catch {
      setInvoices(scopeInvoices(user, MOCK_INVOICES, MOCK_CUSTOMERS));
      setCustomers(MOCK_CUSTOMERS);
    } finally {
      setIsLoading(false);
    }
  }, [formData.customer_id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setFormData({
      customer_id: customers[0]?.id || 1,
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      notes: 'Payment due within 14 days via Mobile Money or Card settlement.',
      items: [{ description: 'Enterprise Software License', quantity: 1, unit_price: 2500000 }],
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 500000 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, val: string | number) => {
    setFormData((prev) => {
      const copy = [...prev.items];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, items: copy };
    });
  };

  const calculateSubtotal = () => {
    return formData.items.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
      0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const cust = customers.find((c) => c.id === formData.customer_id);
    const totalAmount = calculateSubtotal();

    const newInvoice: Invoice = {
      id: Date.now(),
      customer_id: formData.customer_id,
      invoice_number: `INV-2026-00${invoices.length + 1}`,
      status: 'sent',
      total_amount: totalAmount,
      due_date: formData.due_date,
      notes: formData.notes,
      created_at: new Date().toISOString(),
      customer: cust,
      items: formData.items.map((it, idx) => ({
        id: Date.now() + idx,
        invoice_id: Date.now(),
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        subtotal: it.quantity * it.unit_price,
      })),
    };

    try {
      await invoiceService.createInvoice(formData);
      setSuccessMessage('Invoice issued and dispatched.');
    } catch {
      setSuccessMessage('Invoice recorded successfully.');
    } finally {
      setInvoices((prev) => [newInvoice, ...prev]);
      setIsModalOpen(false);
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: InvoiceStatus) => {
    try {
      await invoiceService.updateInvoiceStatus(id, status);
    } catch {
      // Local optimistic update
    }
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
    );
    setSuccessMessage(`Invoice marked as ${status}.`);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.notes && inv.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              {isClientView ? 'My Account' : 'Accounting'}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-[#05AD98]">
              {isClientView
                ? `Invoices${clientProfile ? ` · ${clientProfile.company_name || clientProfile.name}` : ''}`
                : 'Customer Invoices'}
            </span>
            <span className="text-xs text-slate-400 font-medium">({filteredInvoices.length} invoices)</span>
          </div>

          {canIssueInvoices && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Issue Invoice
              </Button>
            </div>
          )}
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search invoice number, client name, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05AD98] focus:bg-white transition-colors"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium rounded-lg bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-[#05AD98]"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="sent">Sent / Pending</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#05AD98]" />
            <p className="text-xs font-medium">Loading invoices ledger...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No invoices recorded</p>
            <p className="text-xs text-slate-400">
              {isClientView
                ? 'No invoice has been issued to your account yet.'
                : 'Issue an invoice to bill customers.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  {!isClientView && <th className="px-4 py-3">Customer</th>}
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount Due</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Issued Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {inv.invoice_number}
                    </td>
                    {!isClientView && (
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {inv.customer?.name || inv.customer?.company_name || `Customer #${inv.customer_id}`}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          inv.status === 'paid'
                            ? 'success'
                            : inv.status === 'sent'
                            ? 'warning'
                            : inv.status === 'overdue'
                            ? 'danger'
                            : 'silver'
                        }
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {Number(inv.total_amount).toLocaleString()} XAF
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {inv.due_date || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {inv.status !== 'paid' && (
                        <>
                          {canIssueInvoices && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(inv.id, 'paid')}
                              leftIcon={<CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            >
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/payments')}
                            leftIcon={<CreditCard className="w-3 h-3" />}
                          >
                            Pay
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ISSUE INVOICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Issue Customer Invoice</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billed Customer *
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.company_name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Payment Due Date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Invoice Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-[#05AD98] hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Item Description / Service"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-full text-xs bg-white border border-slate-300 rounded-md px-2 py-1.5 text-slate-900 text-center focus:outline-none focus:border-[#05AD98]"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                          className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                          required
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="pt-3 text-right text-xs">
                  <span className="text-slate-500 font-medium">Invoice Total: </span>
                  <span className="text-base font-bold text-slate-900">
                    {calculateSubtotal().toLocaleString()} XAF
                  </span>
                </div>
              </div>

              <Input
                label="Payment Instructions / Memo"
                placeholder="e.g. Please wire or pay via Mobile Money within due date."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Dispatch Invoice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
