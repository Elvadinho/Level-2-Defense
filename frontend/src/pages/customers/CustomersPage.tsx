import React, { useState, useEffect, useCallback } from 'react';
import { customerService } from '../../services/customerService';
import { Customer, CreateCustomerData } from '../../types/finance';
import { MOCK_CUSTOMERS } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import {
  Building2,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  X,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // View & Filters
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<CreateCustomerData>({
    contact_name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    tax_number: '',
    type: 'company',
  });

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomers().catch(() => []);
      setCustomers(Array.isArray(data) && data.length > 0 ? data : MOCK_CUSTOMERS);
    } catch {
      setCustomers(MOCK_CUSTOMERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      contact_name: '',
      company_name: '',
      email: '',
      phone: '',
      address: '',
      tax_number: '',
      type: 'company',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      contact_name: cust.name || cust.contact_name || '',
      company_name: cust.company_name || '',
      email: cust.email,
      phone: cust.phone || '',
      address: cust.address || '',
      tax_number: cust.tax_number || '',
      type: cust.type || 'company',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this customer account?')) return;
    try {
      await customerService.deleteCustomer(id);
    } catch {
      // Local delete
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setSuccessMessage('Customer record deleted.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const displayName = formData.company_name || formData.contact_name;

    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, formData);
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? {
                  ...c,
                  name: displayName,
                  contact_name: formData.contact_name,
                  company_name: formData.company_name,
                  email: formData.email,
                  phone: formData.phone,
                  address: formData.address,
                }
              : c
          )
        );
        setSuccessMessage('Customer details updated.');
      } else {
        await customerService.createCustomer(formData);
        const newCust: Customer = {
          id: Date.now(),
          name: displayName,
          contact_name: formData.contact_name,
          company_name: formData.company_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          created_at: new Date().toISOString(),
        };
        setCustomers((prev) => [newCust, ...prev]);
        setSuccessMessage('Customer registered successfully.');
      }
      setIsModalOpen(false);
    } catch {
      // Local optimistic update
      if (editingCustomer) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? {
                  ...c,
                  name: displayName,
                  contact_name: formData.contact_name,
                  company_name: formData.company_name,
                  email: formData.email,
                  phone: formData.phone,
                  address: formData.address,
                }
              : c
          )
        );
        setSuccessMessage('Customer details updated.');
      } else {
        const newCust: Customer = {
          id: Date.now(),
          name: displayName,
          contact_name: formData.contact_name,
          company_name: formData.company_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          created_at: new Date().toISOString(),
        };
        setCustomers((prev) => [newCust, ...prev]);
        setSuccessMessage('Customer registered successfully.');
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    const term = searchQuery.toLowerCase();
    const nameMatch = (cust.name || '').toLowerCase().includes(term);
    const companyMatch = (cust.company_name || '').toLowerCase().includes(term);
    const emailMatch = (cust.email || '').toLowerCase().includes(term);
    return nameMatch || companyMatch || emailMatch;
  });

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">Sales & CRM</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-[#05AD98]">Customers</span>
            <span className="text-xs text-slate-400 font-medium">({filteredCustomers.length} accounts)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Customer
            </Button>

            {/* View Switchers */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 ml-auto md:ml-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search filter */}
        <div className="relative flex-1 w-full pt-2 border-t border-slate-100">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none mt-1" />
          <input
            type="text"
            placeholder="Search company name, contact, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05AD98] focus:bg-white transition-colors"
          />
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

      {/* Main View Area */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#05AD98]" />
          <p className="text-xs font-medium">Loading customer directory...</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-[#05AD98]/50 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#05AD98]/10 text-[#049381] font-bold flex items-center justify-center text-sm border border-[#05AD98]/20">
                    <Building2 className="w-5 h-5 text-[#05AD98]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {cust.company_name || cust.name || 'Enterprise Client'}
                    </h3>
                    {cust.contact_name && (
                      <p className="text-xs text-slate-500 font-medium">Contact: {cust.contact_name}</p>
                    )}
                  </div>
                </div>

                <Badge variant="silver" size="sm">
                  Client
                </Badge>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{cust.email}</span>
                </div>
                {cust.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cust.phone}</span>
                  </div>
                )}
                {cust.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-500">{cust.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(cust)}
                  className="p-1.5 text-slate-500 hover:text-[#05AD98] hover:bg-slate-100 rounded-md transition-colors text-xs inline-flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(cust.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors text-xs inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Company / Client</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {cust.company_name || cust.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{cust.contact_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{cust.email}</td>
                    <td className="px-4 py-3 text-slate-600">{cust.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{cust.address || '—'}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="p-1 text-slate-400 hover:text-[#05AD98]"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cust.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingCustomer ? 'Edit Customer Information' : 'Register New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Company Name"
                  placeholder="e.g. TechCorp S.A."
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
                <Input
                  label="Contact Person"
                  placeholder="e.g. Jean Dupont"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="contact@company.cm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="+237 699 00 00 00"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <Input
                label="Physical Address"
                placeholder="e.g. 142 Boulevard de la Liberté, Douala"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  {editingCustomer ? 'Save Changes' : 'Register Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
