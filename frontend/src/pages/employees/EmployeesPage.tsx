import React, { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../../services/employeeService';
import { Employee, Department, CreateEmployeeData, EmploymentStatus } from '../../types/employee';
import { MOCK_EMPLOYEES, MOCK_DEPARTMENTS } from '../../data/mockData';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  X,
  Loader2,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // View & Filters
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDepartmentSubmitting, setIsDepartmentSubmitting] = useState<boolean>(false);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');

  // Form State
  const [formData, setFormData] = useState<CreateEmployeeData>({
    name: '',
    email: '',
    user_id: undefined,
    password: '',
    password_confirmation: '',
    department_id: 0,
    job_title: '',
    salary: 1500000,
    hire_date: new Date().toISOString().split('T')[0],
    status: 'active',
    phone: '',
    address: '',
    role: 'employee',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [empData, deptData] = await Promise.all([
        employeeService.getEmployees().catch(() => []),
        employeeService.getDepartments().catch(() => []),
      ]);
      const resolvedEmps = Array.isArray(empData) && empData.length > 0 ? empData : MOCK_EMPLOYEES;
      const resolvedDepts = Array.isArray(deptData) && deptData.length > 0 ? deptData : MOCK_DEPARTMENTS;
      setEmployees(resolvedEmps);
      setDepartments(resolvedDepts);
    } catch {
      setEmployees(MOCK_EMPLOYEES);
      setDepartments(MOCK_DEPARTMENTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      user_id: undefined,
      password: '',
      password_confirmation: '',
      department_id: 0,
      job_title: '',
      salary: 1500000,
      hire_date: new Date().toISOString().split('T')[0],
      status: 'active',
      phone: '',
      address: '',
      role: 'employee',
    });
    setIsModalOpen(true);
  };

  const handleCreateDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsDepartmentSubmitting(true);
    setError(null);
    try {
      const department = await employeeService.createDepartment({
        name: departmentName.trim(),
        description: departmentDescription.trim() || undefined,
      });
      setDepartments((current) => [...current, department].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData((current) => ({ ...current, department_id: department.id }));
      setDepartmentName('');
      setDepartmentDescription('');
      setIsDepartmentModalOpen(false);
      setSuccessMessage(`Department “${department.name}” created and selected.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the department.');
    } finally {
      setIsDepartmentSubmitting(false);
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.user?.name || '',
      email: emp.user?.email || '',
      user_id: undefined,
      password: '',
      password_confirmation: '',
      department_id: emp.department_id,
      job_title: emp.job_title,
      salary: Number(emp.salary) || 0,
      hire_date: emp.hire_date ? emp.hire_date.substring(0, 10) : '',
      status: emp.status,
      phone: emp.phone || '',
      address: emp.address || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_id) {
      setError('Select a department before creating or updating an employee.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const targetDept = departments.find((d) => d.id === formData.department_id);

    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, formData);
        setSuccessMessage('Employee record updated.');
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === editingEmployee.id
              ? {
                  ...emp,
                  job_title: formData.job_title,
                  department_id: formData.department_id,
                  salary: formData.salary || emp.salary,
                  status: formData.status || emp.status,
                  department: targetDept,
                  user: {
                    ...emp.user!,
                    name: formData.name,
                    email: formData.email,
                  },
                }
              : emp
          )
        );
      } else {
        const createdEmployee = await employeeService.createEmployee(formData);
        setSuccessMessage('Employee added to directory.');
        setEmployees((prev) => [createdEmployee, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save the employee record.';
      setError(message);
      // Never add a local-only employee: attendance requires a real linked account.
      if (editingEmployee) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === editingEmployee.id
              ? {
                  ...emp,
                  job_title: formData.job_title,
                  department_id: formData.department_id,
                  salary: formData.salary || emp.salary,
                  status: formData.status || emp.status,
                  department: targetDept,
                  user: {
                    ...emp.user!,
                    name: formData.name,
                    email: formData.email,
                  },
                }
              : emp
          )
        );
        setSuccessMessage('Employee record updated locally. The server update could not be confirmed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this employee record?')) return;
    try {
      await employeeService.deleteEmployee(id);
    } catch {
      // Local delete
    }
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setSuccessMessage('Employee deleted.');
  };

  // Filtered list
  const filteredEmployees = employees.filter((emp) => {
    const nameMatch = emp.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const emailMatch = emp.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const titleMatch = emp.job_title.toLowerCase().includes(searchQuery.toLowerCase());
    const deptMatch = selectedDept === 'all' || emp.department_id.toString() === selectedDept;
    const statusMatch = selectedStatus === 'all' || emp.status === selectedStatus;

    return (nameMatch || emailMatch || titleMatch) && deptMatch && statusMatch;
  });

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">Human Resources</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-[#05AD98]">Employees Directory</span>
            <span className="text-xs text-slate-400 font-medium">({filteredEmployees.length} staff)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDepartmentModalOpen(true)}
              leftIcon={<Building2 className="w-3.5 h-3.5" />}
            >
              New Department
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Employee
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

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, job title, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#05AD98] focus:bg-white transition-colors"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs font-medium rounded-lg bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-[#05AD98]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id.toString()}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-medium rounded-lg bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 focus:outline-none focus:border-[#05AD98]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
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

      {/* Main Content */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#05AD98]" />
          <p className="text-xs font-medium">Loading staff roster...</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-[#05AD98]/50 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#05AD98]/10 text-[#049381] font-bold flex items-center justify-center text-sm border border-[#05AD98]/20">
                    {emp.user?.name ? emp.user.name.charAt(0).toUpperCase() : 'E'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {emp.user?.name || 'Unnamed Staff'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{emp.job_title}</p>
                  </div>
                </div>

                <Badge
                  variant={
                    emp.status === 'active'
                      ? 'success'
                      : emp.status === 'on_leave'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  {emp.status}
                </Badge>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.department?.name || 'General Department'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{emp.user?.email}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Hired: {emp.hire_date ? emp.hire_date.substring(0, 10) : '—'}</span>
                  <span className="font-semibold text-slate-800">
                    {Number(emp.salary).toLocaleString()} XAF
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-1.5 text-slate-500 hover:text-[#05AD98] hover:bg-slate-100 rounded-md transition-colors text-xs inline-flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
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
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Job Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Salary</th>
                  <th className="px-4 py-3">Hire Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{emp.user?.name || 'Unnamed'}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{emp.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{emp.job_title}</td>
                    <td className="px-4 py-3 text-slate-600">{emp.department?.name || 'General'}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          emp.status === 'active'
                            ? 'success'
                            : emp.status === 'on_leave'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {Number(emp.salary).toLocaleString()} XAF
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {emp.hire_date ? emp.hire_date.substring(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1 text-slate-400 hover:text-[#05AD98]"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
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

      {/* CREATE / EDIT EMPLOYEE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingEmployee ? 'Edit Employee Profile' : 'Register New Employee'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {!editingEmployee && (
                <div className="rounded-lg border border-[#05AD98]/30 bg-[#05AD98]/5 p-3">
                  <Input
                    label="Link Existing Account ID (optional)"
                    type="number"
                    placeholder="Find the ID in User Accounts"
                    value={formData.user_id || ''}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value ? Number(e.target.value) : undefined })}
                    helperText="Use this to give an existing sign-in account an employee profile for attendance scanning."
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  placeholder="e.g. Marc Ekwalla"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!formData.user_id}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="marc@modoo.cm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={!formData.user_id}
                />
              </div>

              {!editingEmployee && !formData.user_id && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Account Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    helperText="At least 8 characters. The employee uses this to sign in."
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Department *
                  </label>
                  <select
                    value={formData.department_id || ''}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value ? Number(e.target.value) : 0 })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                    required
                  >
                    <option value="" disabled>Select the employee's department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Job Title"
                  placeholder="e.g. Senior Backend Engineer"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Monthly Salary (XAF)"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                />

                <Input
                  label="Hire Date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EmploymentStatus })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#05AD98]"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>

                <Input
                  label="Phone Number"
                  placeholder="+237 699 00 00 00"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  {editingEmployee ? 'Save Changes' : 'Add Employee'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDepartmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#05AD98]" />
                <h3 className="font-bold text-base text-slate-900">Create Department</h3>
              </div>
              <button onClick={() => setIsDepartmentModalOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDepartment} className="space-y-4 pt-4">
              <Input label="Department Name" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} placeholder="e.g. Operations" required autoFocus />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Description</label>
                <textarea value={departmentDescription} onChange={(e) => setDepartmentDescription(e.target.value)} placeholder="Optional description" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#05AD98] focus:outline-none" rows={3} />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsDepartmentModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isDepartmentSubmitting}>Create Department</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
