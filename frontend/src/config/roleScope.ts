import { User, UserRole } from '../types/auth';
import { Customer, Invoice, Payment, Quotation } from '../types/finance';
import { Employee } from '../types/employee';
import { Task, Project } from '../types/project';
import { AttendanceRecord } from '../types/attendance';

/**
 * Role-based data scoping helpers
 * Guarantees every module only exposes the records the authenticated role owns.
 * Menu/route guards hide modules, these helpers guard the records inside them.
 */

const normalize = (value?: string | null): string => (value || '').trim().toLowerCase();

/** Roles operating on the company side of the workspace (internal staff) */
export const INTERNAL_ROLES: UserRole[] = [
  'admin',
  'hr_manager',
  'project_manager',
  'employee',
  'accountant',
  'intern',
];

/** External portal role: only ever sees its own commercial documents */
export const isCustomerRole = (role?: UserRole): boolean => role === 'customer';

/** Roles allowed to create/edit commercial documents (quotes, invoices, payments) */
export const canManageFinance = (role?: UserRole): boolean =>
  role === 'admin' || role === 'accountant';

/** Roles allowed to settle an invoice on their own behalf */
export const canPayInvoices = (role?: UserRole): boolean =>
  role === 'admin' || role === 'accountant' || role === 'customer';

/** Roles allowed to reshape boards, stages and task assignments */
export const canManageTasks = (role?: UserRole): boolean =>
  role === 'admin' || role === 'project_manager' || role === 'hr_manager';

/**
 * Resolve the client account linked to a portal user.
 * Matching is attempted on the linked user id first, then on the account email.
 */
export const resolveCustomerProfile = (
  user: User | null,
  customers: Customer[]
): Customer | undefined => {
  if (!user) return undefined;

  return (
    customers.find((c) => c.user_id === user.id) ||
    customers.find((c) => normalize(c.email) === normalize(user.email)) ||
    customers.find((c) => normalize(c.user?.email) === normalize(user.email))
  );
};

/**
 * Resolve the employee record linked to a staff user (matched by user id then email).
 */
export const resolveEmployeeProfile = (
  user: User | null,
  employees: Employee[]
): Employee | undefined => {
  if (!user) return undefined;

  return (
    employees.find((e) => e.user_id === user.id) ||
    employees.find((e) => normalize(e.user?.email) === normalize(user.email))
  );
};

/**
 * Restrict quotations to the signed-in client account.
 * Unknown client accounts intentionally resolve to an empty ledger instead of every record.
 */
export const scopeQuotations = (
  user: User | null,
  quotations: Quotation[],
  customers: Customer[]
): Quotation[] => {
  if (!isCustomerRole(user?.role)) return quotations;

  const profile = resolveCustomerProfile(user, customers);
  if (!profile) return [];

  return quotations.filter(
    (q) => q.customer_id === profile.id || normalize(q.customer?.email) === normalize(profile.email)
  );
};

/** Restrict invoices to the signed-in client account */
export const scopeInvoices = (
  user: User | null,
  invoices: Invoice[],
  customers: Customer[]
): Invoice[] => {
  if (!isCustomerRole(user?.role)) return invoices;

  const profile = resolveCustomerProfile(user, customers);
  if (!profile) return [];

  return invoices.filter(
    (i) => i.customer_id === profile.id || normalize(i.customer?.email) === normalize(profile.email)
  );
};

/** Restrict payments to the signed-in client account (direct or through the parent invoice) */
export const scopePayments = (
  user: User | null,
  payments: Payment[],
  customers: Customer[]
): Payment[] => {
  if (!isCustomerRole(user?.role)) return payments;

  const profile = resolveCustomerProfile(user, customers);
  if (!profile) return [];

  return payments.filter(
    (p) =>
      p.customer_id === profile.id ||
      p.invoice?.customer_id === profile.id ||
      normalize(p.email) === normalize(profile.email) ||
      normalize(p.invoice?.customer?.email) === normalize(profile.email)
  );
};

/**
 * Tasks visible to the user.
 * Managers see the whole board, individual contributors only their own assignments,
 * and client accounts never receive internal delivery work.
 */
export const scopeTasks = (
  user: User | null,
  tasks: Task[],
  employees: Employee[]
): Task[] => {
  if (isCustomerRole(user?.role)) return [];
  if (canManageTasks(user?.role)) return tasks;

  const profile = resolveEmployeeProfile(user, employees);
  if (!profile) return [];

  return tasks.filter((t) => t.assigned_to === profile.id);
};

/** Projects the user contributes to (managers and admins keep the full portfolio) */
export const scopeProjects = (
  user: User | null,
  projects: Project[],
  employees: Employee[]
): Project[] => {
  if (isCustomerRole(user?.role)) return [];
  if (canManageTasks(user?.role)) return projects;

  const profile = resolveEmployeeProfile(user, employees);
  if (!profile) return [];

  return projects.filter((p) => p.members?.some((m) => m.employee_id === profile.id));
};

/** Attendance rows visible to the user (staff see their own, HR and admins see everyone) */
export const scopeAttendance = (
  user: User | null,
  records: AttendanceRecord[],
  employees: Employee[]
): AttendanceRecord[] => {
  if (isCustomerRole(user?.role)) return [];
  if (user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'project_manager') {
    return records;
  }

  const profile = resolveEmployeeProfile(user, employees);
  if (!profile) return [];

  return records.filter((r) => r.employee_id === profile.id);
};
