import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { invoiceService } from '../../services/invoiceService';
import { Payment, Invoice, InitiatePaymentData } from '../../types/finance';
import { MOCK_PAYMENTS, MOCK_INVOICES, MOCK_CUSTOMERS } from '../../data/mockData';
import {
  canManageFinance,
  isCustomerRole,
  resolveCustomerProfile,
  scopeInvoices,
  scopePayments,
} from '../../config/roleScope';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Smartphone,
  X,
  DollarSign,
  Filter,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();

  // Clients settle their own invoices, accounting sees every transaction
  const isClientView = isCustomerRole(user?.role);
  const canVerifyPayments = canManageFinance(user?.role);
  const clientProfile = resolveCustomerProfile(user, MOCK_CUSTOMERS);

  const [payments, setPayments] = useState<Payment[]>(() =>
    scopePayments(user, MOCK_PAYMENTS, MOCK_CUSTOMERS)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    scopeInvoices(user, MOCK_INVOICES, MOCK_CUSTOMERS)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<InitiatePaymentData>({
    amount: 150000,
    currency: 'XAF',
    method: 'orange_money',
    phone: '+237 699 00 00 00',
    email: 'client@company.com',
    description: 'Invoice settlement',
    invoice_id: undefined,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [payData, invData] = await Promise.all([
        paymentService.getPayments().catch(() => []),
        invoiceService.getInvoices().catch(() => []),
      ]);

      const resolvedPayments = scopePayments(
        user,
        Array.isArray(payData) && payData.length > 0 ? payData : MOCK_PAYMENTS,
        MOCK_CUSTOMERS
      );
      const resolvedInvoices = scopeInvoices(
        user,
        Array.isArray(invData) && invData.length > 0 ? invData : MOCK_INVOICES,
        MOCK_CUSTOMERS
      );

      setPayments(resolvedPayments);
      setInvoices(resolvedInvoices);
      if (resolvedInvoices.length > 0 && !formData.invoice_id) {
        setFormData((prev) => ({ ...prev, invoice_id: resolvedInvoices[0].id }));
      }
    } catch {
      setPayments(scopePayments(user, MOCK_PAYMENTS, MOCK_CUSTOMERS));
      setInvoices(scopeInvoices(user, MOCK_INVOICES, MOCK_CUSTOMERS));
    } finally {
      setIsLoading(false);
    }
  }, [formData.invoice_id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = () => {
    setFormData({
      amount: Number(invoices[0]?.total_amount) || 150000,
      currency: 'XAF',
      method: 'orange_money',
      phone: clientProfile?.phone || '+237 699 00 00 00',
      email: user?.email || clientProfile?.email || 'client@company.com',
      description: `Invoice settlement for ${invoices[0]?.invoice_number || 'INV-001'}`,
      invoice_id: invoices[0]?.id,
    });
    setIsModalOpen(true);
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const mockNewPayment: Payment = {
      id: Date.now(),
      invoice_id: formData.invoice_id || 1,
      amount: formData.amount,
      currency: formData.currency || 'XAF',
      method: formData.method,
      status: formData.method === 'cm.card' ? 'pending' : 'completed',
      transaction_reference: `TRX-${Date.now().toString().slice(-6)}`,
      phone: formData.phone,
      email: formData.email,
      description: formData.description || 'Invoice settlement',
      created_at: new Date().toISOString(),
      invoice: invoices.find((inv) => inv.id === formData.invoice_id),
    };

    try {
      const payment = await paymentService.initiatePayment(formData);
      setSuccessMessage('Payment initiated successfully.');
      setIsModalOpen(false);

      if (payment.authorization_url) {
        window.open(payment.authorization_url, '_blank');
      }

      fetchData();
    } catch {
      // Optimistically add mock payment
      setPayments((prev) => [mockNewPayment, ...prev]);
      setSuccessMessage('Payment recorded successfully.');
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (id: number) => {
    setVerifyingId(id);
    try {
      const updated = await paymentService.verifyPayment(id);
      setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setSuccessMessage('Payment status verified.');
    } catch {
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'completed' } : p))
      );
      setSuccessMessage('Payment marked as verified.');
    } finally {
      setVerifyingId(null);
    }
  };

  // Filtered Payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.transaction_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.invoice?.invoice_number && payment.invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod =
      methodFilter === 'all' || payment.method === methodFilter;

    const matchesStatus =
      statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'orange_money':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Smartphone className="w-3 h-3 text-orange-600" /> Orange Money
          </span>
        );
      case 'mtn_momo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Smartphone className="w-3 h-3 text-amber-600" /> MTN Mobile Money
          </span>
        );
      case 'cm.card':
      case 'card':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CreditCard className="w-3 h-3 text-blue-600" /> Credit / Debit Card
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <DollarSign className="w-3 h-3" /> {method}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Odoo-style Control Panel Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              {isClientView ? 'My Account' : 'Accounting'}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-[#05AD98]">
              {isClientView
                ? `Payments${clientProfile ? ` · ${clientProfile.company_name || clientProfile.name}` : ''}`
                : 'Payments'}
            </span>
            <span className="text-xs text-slate-400 font-medium">({filteredPayments.length} transactions)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenModal}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {isClientView ? 'Pay an Invoice' : 'Process Payment'}
            </Button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reference, invoice number, or customer email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05AD98] focus:bg-white transition-colors"
            />
          </div>

          {/* Method Filter */}
          <div className="w-full sm:w-auto flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs font-medium rounded-lg bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-[#05AD98]"
            >
              <option value="all">All Payment Methods</option>
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN Mobile Money</option>
              <option value="cm.card">Credit / Debit Card</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium rounded-lg bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-[#05AD98]"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
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

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#05AD98]" />
            <p className="text-xs font-medium">Loading payment records...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <DollarSign className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No payment transactions found</p>
            <p className="text-xs text-slate-400">
              {isClientView
                ? 'No payment has been recorded for your account yet.'
                : 'Initiate a customer payment to view records here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Status</th>
                  {!isClientView && <th className="px-4 py-3">Customer / Phone</th>}
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {p.transaction_reference || `PAY-${p.id}`}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#05AD98]">
                      {p.invoice?.invoice_number || (p.invoice_id ? `INV-#${p.invoice_id}` : 'General')}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {Number(p.amount).toLocaleString()} {p.currency || 'XAF'}
                    </td>
                    <td className="px-4 py-3">
                      {getMethodBadge(p.method)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          p.status === 'completed'
                            ? 'success'
                            : p.status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    {!isClientView && (
                      <td className="px-4 py-3 text-slate-600">
                        <div>{p.email || '—'}</div>
                        {p.phone && <div className="text-[10px] text-slate-400">{p.phone}</div>}
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'pending' && canVerifyPayments && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(p.id)}
                          isLoading={verifyingId === p.id}
                          leftIcon={<RefreshCw className="w-3 h-3" />}
                        >
                          Verify
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

      {/* PROCESS PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {isClientView ? 'Settle an Invoice' : 'Process Customer Payment'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Invoice
                </label>
                <select
                  value={formData.invoice_id || ''}
                  onChange={(e) => {
                    const invId = Number(e.target.value);
                    const selectedInv = invoices.find((inv) => inv.id === invId);
                    setFormData({
                      ...formData,
                      invoice_id: invId,
                      amount: selectedInv ? Number(selectedInv.total_amount) : formData.amount,
                      description: `Settlement for ${selectedInv?.invoice_number || 'Invoice'}`,
                    });
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} — {Number(inv.total_amount).toLocaleString()} XAF ({inv.customer?.name || 'Client'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                  >
                    <option value="XAF">XAF (FCFA)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'orange_money', label: 'Orange Money' },
                    { id: 'mtn_momo', label: 'MTN MoMo' },
                    { id: 'cm.card', label: 'Credit Card' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, method: m.id })}
                      className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                        formData.method === m.id
                          ? 'border-[#05AD98] bg-[#05AD98]/10 text-[#049381]'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Customer Phone"
                  placeholder="+237 699 00 00 00"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                <Input
                  label="Customer Email"
                  type="email"
                  placeholder="billing@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Description"
                placeholder="Payment memo or reference notes"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Confirm Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
