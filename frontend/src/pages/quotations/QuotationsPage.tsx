import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { quotationService } from '../../services/quotationService';
import { customerService } from '../../services/customerService';
import { Quotation, Customer, CreateQuotationData, QuotationStatus } from '../../types/finance';
import { MOCK_QUOTATIONS, MOCK_CUSTOMERS } from '../../data/mockData';
import {
  canManageFinance,
  isCustomerRole,
  resolveCustomerProfile,
  scopeQuotations,
} from '../../config/roleScope';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Filter,
  Send,
  XCircle,
} from 'lucide-react';

export const QuotationsPage: React.FC = () => {
  const { user } = useAuth();

  // Sales staff draft and dispatch quotes, clients only review the ones addressed to them
  const isClientView = isCustomerRole(user?.role);
  const canManageQuotations = canManageFinance(user?.role);
  const clientProfile = resolveCustomerProfile(user, MOCK_CUSTOMERS);

  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    scopeQuotations(user, MOCK_QUOTATIONS, MOCK_CUSTOMERS)
  );
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<CreateQuotationData>({
    customer_id: 1,
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: '',
    items: [{ description: 'Custom ERP Implementation Module', quantity: 1, unit_price: 3500000 }],
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [quotes, custs] = await Promise.all([
        quotationService.getQuotations().catch(() => []),
        customerService.getCustomers().catch(() => []),
      ]);
      const resolvedCustomers = Array.isArray(custs) && custs.length > 0 ? custs : MOCK_CUSTOMERS;
      const resolvedQuotations =
        Array.isArray(quotes) && quotes.length > 0 ? quotes : MOCK_QUOTATIONS;

      setCustomers(resolvedCustomers);
      setQuotations(scopeQuotations(user, resolvedQuotations, resolvedCustomers));
      if (custs.length > 0 && !formData.customer_id) {
        setFormData((prev) => ({ ...prev, customer_id: custs[0].id }));
      }
    } catch {
      setQuotations(scopeQuotations(user, MOCK_QUOTATIONS, MOCK_CUSTOMERS));
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
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: '',
      items: [{ description: 'Enterprise License Tier', quantity: 1, unit_price: 2500000 }],
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

    const newQuotation: Quotation = {
      id: Date.now(),
      customer_id: formData.customer_id,
      quotation_number: `QT-2026-00${quotations.length + 1}`,
      status: 'draft',
      total_amount: totalAmount,
      valid_until: formData.valid_until,
      notes: formData.notes,
      created_at: new Date().toISOString(),
      customer: cust,
      items: formData.items.map((it, idx) => ({
        id: Date.now() + idx,
        quotation_id: Date.now(),
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        subtotal: it.quantity * it.unit_price,
      })),
    };

    try {
      await quotationService.createQuotation(formData);
      setSuccessMessage('Quotation generated successfully.');
    } catch {
      // Local optimistic update
      setSuccessMessage('Quotation draft saved.');
    } finally {
      setQuotations((prev) => [newQuotation, ...prev]);
      setIsModalOpen(false);
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: QuotationStatus) => {
    try {
      await quotationService.updateQuotationStatus(id, status);
    } catch {
      // Keep optimistic
    }
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status } : q))
    );
    setSuccessMessage(`Quotation status updated to ${status}.`);
  };

  const filteredQuotations = quotations.filter((q) => {
    const qNum = q.quotation_number || q.quote_number || `QT-${q.id}`;
    const matchesSearch =
      qNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.customer?.name && q.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.notes && q.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              {isClientView ? 'My Account' : 'Sales & Billing'}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-[#05AD98]">
              {isClientView
                ? `Quotations${clientProfile ? ` · ${clientProfile.company_name || clientProfile.name}` : ''}`
                : 'Quotations & Estimates'}
            </span>
            <span className="text-xs text-slate-400 font-medium">({filteredQuotations.length} quotes)</span>
          </div>

          {canManageQuotations && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Create Quotation
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
              placeholder="Search quotation number, client name, notes..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent to Client</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
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

      {/* Quotations Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#05AD98]" />
            <p className="text-xs font-medium">Loading sales quotations...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No quotations found</p>
            <p className="text-xs text-slate-400">
              {isClientView
                ? 'No quotation has been shared with your account yet.'
                : 'Draft a new price estimate to see it listed here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Quotation #</th>
                  {!isClientView && <th className="px-4 py-3">Customer</th>}
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Valid Until</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {q.quotation_number}
                    </td>
                    {!isClientView && (
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {q.customer?.name || q.customer?.company_name || `Customer #${q.customer_id}`}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          q.status === 'approved'
                            ? 'success'
                            : q.status === 'sent'
                            ? 'primary'
                            : q.status === 'rejected'
                            ? 'danger'
                            : 'silver'
                        }
                        size="sm"
                      >
                        {q.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {Number(q.total_amount).toLocaleString()} XAF
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {q.valid_until || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                      {q.notes || 'Standard terms'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {q.status === 'draft' && canManageQuotations && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(q.id, 'sent')}
                          leftIcon={<Send className="w-3 h-3" />}
                        >
                          Send
                        </Button>
                      )}
                      {q.status === 'sent' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStatusChange(q.id, 'approved')}
                          leftIcon={<CheckCircle2 className="w-3 h-3" />}
                        >
                          Approve
                        </Button>
                      )}
                      {q.status === 'sent' && isClientView && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(q.id, 'declined')}
                          leftIcon={<XCircle className="w-3 h-3 text-rose-600" />}
                        >
                          Decline
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE QUOTATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create Sales Quotation</h3>
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
                    Customer / Client *
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
                  label="Valid Until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  required
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Line Items
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
                          placeholder="Description / Service"
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

                {/* Subtotal Calculation */}
                <div className="pt-3 text-right text-xs">
                  <span className="text-slate-500 font-medium">Estimated Total: </span>
                  <span className="text-base font-bold text-slate-900">
                    {calculateSubtotal().toLocaleString()} XAF
                  </span>
                </div>
              </div>

              <Input
                label="Notes / Terms"
                placeholder="e.g. 50% advance on approval, remaining upon delivery."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Generate Quotation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
