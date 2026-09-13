import { LucideIcon } from 'lucide-react';
import {
  Users,
  FolderKanban,
  CheckSquare,
  Receipt,
  CreditCard,
  Clock,
  FileText,
  Building2,
  TrendingUp,
  AlertTriangle,
  CalendarClock,
  Wallet,
  ListChecks,
  UserCheck,
} from 'lucide-react';
import { User, UserRole } from '../../types/auth';
import { BadgeProps } from '../../components/common/Badge';
import {
  MOCK_ATTENDANCE,
  MOCK_CUSTOMERS,
  MOCK_DEPARTMENTS,
  MOCK_EMPLOYEES,
  MOCK_INVOICES,
  MOCK_PAYMENTS,
  MOCK_PROJECTS,
  MOCK_QUOTATIONS,
  MOCK_TASKS,
  INITIAL_KANBAN_STAGES,
} from '../../data/mockData';
import {
  resolveCustomerProfile,
  resolveEmployeeProfile,
  scopeAttendance,
  scopeInvoices,
  scopePayments,
  scopeProjects,
  scopeQuotations,
  scopeTasks,
} from '../../config/roleScope';

/**
 * Role-aware dashboard model
 * Every figure displayed on the dashboard is derived from the records the role
 * is actually allowed to read, so no role is ever teased with foreign data.
 */

export interface DashboardKpi {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export interface DashboardListItem {
  id: string | number;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: { label: string; variant: BadgeProps['variant'] };
}

export interface DashboardPanel {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  items: DashboardListItem[];
  emptyLabel: string;
  link?: { label: string; path: string };
}

export interface RoleDashboard {
  subtitle: string;
  kpis: DashboardKpi[];
  panels: DashboardPanel[];
}

/**
 * Preferred quick actions per role, expressed as navigation module ids.
 * The dashboard intersects this list with the modules the role can actually open,
 * which prevents offering shortcuts that the route guard would reject.
 */
export const QUICK_ACTION_MODULES: Record<UserRole, string[]> = {
  admin: ['employees', 'projects', 'invoices', 'ai-assistant'],
  hr_manager: ['attendance', 'employees', 'ai-assistant'],
  project_manager: ['tasks', 'projects', 'ai-assistant'],
  employee: ['tasks', 'attendance', 'ai-assistant'],
  intern: ['tasks', 'attendance', 'ai-assistant'],
  accountant: ['invoices', 'payments', 'ai-assistant'],
  customer: ['quotations', 'invoices', 'payments'],
};

const OPEN_TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'review'];
const UNPAID_INVOICE_STATUSES = ['draft', 'sent', 'partial', 'overdue'];

const amount = (value: number): string => `${Math.round(value).toLocaleString()} XAF`;

const toNumber = (value?: number | string | null): number => Number(value || 0);

const startOfToday = (): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

const daysUntil = (date?: string | null): number | null => {
  if (!date) return null;
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - startOfToday().getTime()) / 86400000);
};

const isOverdue = (date?: string | null): boolean => {
  const remaining = daysUntil(date);
  return remaining !== null && remaining < 0;
};

const dueLabel = (date?: string | null): string => {
  const remaining = daysUntil(date);
  if (remaining === null) return 'No due date';
  if (remaining < 0) return `${Math.abs(remaining)} day(s) overdue`;
  if (remaining === 0) return 'Due today';
  if (remaining === 1) return 'Due tomorrow';
  return `Due in ${remaining} days`;
};

const priorityVariant = (priority: string): BadgeProps['variant'] => {
  switch (priority) {
    case 'urgent':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'primary';
    default:
      return 'silver';
  }
};

const invoiceVariant = (status: string): BadgeProps['variant'] => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'overdue':
      return 'danger';
    case 'sent':
    case 'partial':
      return 'warning';
    default:
      return 'silver';
  }
};

const quotationVariant = (status: string): BadgeProps['variant'] => {
  switch (status) {
    case 'approved':
    case 'accepted':
      return 'success';
    case 'declined':
    case 'rejected':
    case 'expired':
      return 'danger';
    case 'sent':
      return 'warning';
    default:
      return 'silver';
  }
};

const attendanceVariant = (status: string): BadgeProps['variant'] => {
  switch (status) {
    case 'present':
      return 'success';
    case 'late':
      return 'warning';
    case 'absent':
      return 'danger';
    default:
      return 'silver';
  }
};

const stageLabel = (status: string): string =>
  INITIAL_KANBAN_STAGES.find((stage) => stage.id === status)?.label || status;

const latestAttendanceDate = (records: { date: string }[]): string | undefined =>
  records.map((r) => r.date).sort((a, b) => b.localeCompare(a))[0];

const customerLabel = (name?: string, company?: string, id?: number): string =>
  name || company || `Customer #${id ?? '—'}`;

/**
 * Build the complete dashboard model for the authenticated user.
 */
export const buildRoleDashboard = (user: User | null): RoleDashboard => {
  const role = user?.role;

  // Records the role is authorised to read
  const tasks = scopeTasks(user, MOCK_TASKS, MOCK_EMPLOYEES);
  const projects = scopeProjects(user, MOCK_PROJECTS, MOCK_EMPLOYEES);
  const attendance = scopeAttendance(user, MOCK_ATTENDANCE, MOCK_EMPLOYEES);
  const invoices = scopeInvoices(user, MOCK_INVOICES, MOCK_CUSTOMERS);
  const quotations = scopeQuotations(user, MOCK_QUOTATIONS, MOCK_CUSTOMERS);
  const payments = scopePayments(user, MOCK_PAYMENTS, MOCK_CUSTOMERS);

  const openTasks = tasks.filter((t) => OPEN_TASK_STATUSES.includes(String(t.status)));
  const overdueTasks = openTasks.filter((t) => isOverdue(t.due_date));
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const unpaidInvoices = invoices.filter((i) => UNPAID_INVOICE_STATUSES.includes(i.status));
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue' || (i.status !== 'paid' && isOverdue(i.due_date)));
  const outstandingAmount = unpaidInvoices.reduce((sum, i) => sum + toNumber(i.total_amount), 0);
  const settledPayments = payments.filter((p) => p.status === 'completed');
  const settledAmount = settledPayments.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const pendingPayments = payments.filter((p) => p.status === 'pending');

  switch (role) {
    /* ------------------------------------------------------------------ ADMIN */
    case 'admin': {
      const presenceDate = latestAttendanceDate(attendance);
      const presenceToday = attendance.filter((a) => a.date === presenceDate);

      return {
        subtitle: 'Company-wide overview of people, delivery and cash position.',
        kpis: [
          {
            title: 'Headcount',
            value: String(MOCK_EMPLOYEES.length),
            hint: `${MOCK_DEPARTMENTS.length} departments`,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            title: 'Active Projects',
            value: String(projects.filter((p) => p.status === 'active' || p.status === 'in_progress').length),
            hint: `${openTasks.length} open tasks, ${overdueTasks.length} late`,
            icon: FolderKanban,
            color: 'text-[#05AD98]',
            bg: 'bg-[#05AD98]/10',
          },
          {
            title: 'Outstanding Receivables',
            value: amount(outstandingAmount),
            hint: `${unpaidInvoices.length} invoice(s) awaiting settlement`,
            icon: Receipt,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            title: 'Cash Collected',
            value: amount(settledAmount),
            hint: `${settledPayments.length} settled payment(s)`,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
        ],
        panels: [
          {
            id: 'attention',
            title: 'Needs Attention',
            description: 'Overdue invoices and late delivery work',
            icon: AlertTriangle,
            emptyLabel: 'Nothing overdue across the company.',
            link: { label: 'Open invoices', path: '/invoices' },
            items: [
              ...overdueInvoices.map((inv) => ({
                id: `inv-${inv.id}`,
                title: `${inv.invoice_number} · ${customerLabel(inv.customer?.name, inv.customer?.company_name, inv.customer_id)}`,
                subtitle: amount(toNumber(inv.total_amount)),
                meta: dueLabel(inv.due_date),
                badge: { label: inv.status, variant: invoiceVariant(inv.status) },
              })),
              ...overdueTasks.slice(0, 3).map((task) => ({
                id: `task-${task.id}`,
                title: task.title,
                subtitle: task.assigned_employee?.user?.name || 'Unassigned',
                meta: dueLabel(task.due_date),
                badge: { label: task.priority, variant: priorityVariant(task.priority) },
              })),
            ],
          },
          {
            id: 'presence',
            title: 'Team Presence',
            description: presenceDate ? `Attendance log for ${presenceDate}` : 'Attendance log',
            icon: UserCheck,
            emptyLabel: 'No attendance recorded yet.',
            link: { label: 'Open attendance', path: '/attendance' },
            items: presenceToday.map((record) => ({
              id: record.id,
              title: record.employee?.user?.name || `Employee #${record.employee_id}`,
              subtitle: record.employee?.job_title,
              meta: `${record.check_in_time || '—'} → ${record.check_out_time || 'still in'}`,
              badge: { label: record.status, variant: attendanceVariant(record.status) },
            })),
          },
          {
            id: 'portfolio',
            title: 'Project Portfolio',
            description: 'Budget and delivery window per project',
            icon: FolderKanban,
            emptyLabel: 'No projects registered.',
            link: { label: 'Open projects', path: '/projects' },
            items: projects.map((project) => ({
              id: project.id,
              title: project.name,
              subtitle: `${amount(toNumber(project.budget))} budget · ${project.members?.length || 0} member(s)`,
              meta: project.end_date ? dueLabel(project.end_date) : 'Open ended',
              badge: { label: project.status, variant: 'primary' as BadgeProps['variant'] },
            })),
          },
        ],
      };
    }

    /* ------------------------------------------------------------- HR MANAGER */
    case 'hr_manager': {
      const presenceDate = latestAttendanceDate(attendance);
      const presenceToday = attendance.filter((a) => a.date === presenceDate);
      const lateArrivals = presenceToday.filter((a) => a.status === 'late');
      const presentCount = presenceToday.filter((a) => a.status === 'present' || a.status === 'late').length;
      const coverage = MOCK_EMPLOYEES.length
        ? Math.round((presentCount / MOCK_EMPLOYEES.length) * 100)
        : 0;

      return {
        subtitle: 'People operations: roster, daily presence and department structure.',
        kpis: [
          {
            title: 'Active Staff',
            value: String(MOCK_EMPLOYEES.filter((e) => e.status === 'active').length),
            hint: `${MOCK_EMPLOYEES.length} employee record(s)`,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            title: 'Presence Coverage',
            value: `${coverage}%`,
            hint: `${presentCount} of ${MOCK_EMPLOYEES.length} checked in`,
            icon: Clock,
            color: 'text-[#05AD98]',
            bg: 'bg-[#05AD98]/10',
          },
          {
            title: 'Late Arrivals',
            value: String(lateArrivals.length),
            hint: presenceDate ? `Recorded on ${presenceDate}` : 'No log yet',
            icon: AlertTriangle,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            title: 'Departments',
            value: String(MOCK_DEPARTMENTS.length),
            hint: MOCK_DEPARTMENTS.map((d) => d.name).slice(0, 2).join(', '),
            icon: Building2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
        ],
        panels: [
          {
            id: 'attendance-log',
            title: 'Daily Attendance',
            description: presenceDate ? `Check-ins for ${presenceDate}` : 'Check-in log',
            icon: UserCheck,
            emptyLabel: 'No attendance recorded yet.',
            link: { label: 'Open attendance', path: '/attendance' },
            items: presenceToday.map((record) => ({
              id: record.id,
              title: record.employee?.user?.name || `Employee #${record.employee_id}`,
              subtitle: record.location,
              meta: `${record.check_in_time || '—'} → ${record.check_out_time || 'still in'}`,
              badge: { label: record.status, variant: attendanceVariant(record.status) },
            })),
          },
          {
            id: 'headcount',
            title: 'Headcount by Department',
            description: 'Distribution of the active roster',
            icon: Building2,
            emptyLabel: 'No departments configured.',
            link: { label: 'Open employees', path: '/employees' },
            items: MOCK_DEPARTMENTS.map((dept) => {
              const staff = MOCK_EMPLOYEES.filter((e) => e.department_id === dept.id);
              return {
                id: dept.id,
                title: dept.name,
                subtitle: staff.map((s) => s.user?.name).filter(Boolean).join(', ') || 'No staff assigned',
                meta: `${staff.length} employee(s)`,
              };
            }),
          },
        ],
      };
    }

    /* -------------------------------------------------------- PROJECT MANAGER */
    case 'project_manager': {
      const completion = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
      const urgentTasks = openTasks
        .filter((t) => t.priority === 'urgent' || t.priority === 'high' || isOverdue(t.due_date))
        .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

      return {
        subtitle: 'Delivery pipeline: workload, blockers and project health.',
        kpis: [
          {
            title: 'Active Projects',
            value: String(projects.filter((p) => p.status === 'active' || p.status === 'in_progress').length),
            hint: `${projects.length} in portfolio`,
            icon: FolderKanban,
            color: 'text-[#05AD98]',
            bg: 'bg-[#05AD98]/10',
          },
          {
            title: 'Open Tasks',
            value: String(openTasks.length),
            hint: `${openTasks.filter((t) => t.status === 'in_progress').length} in progress, ${openTasks.filter((t) => t.status === 'review').length} in review`,
            icon: CheckSquare,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            title: 'Late Tasks',
            value: String(overdueTasks.length),
            hint: overdueTasks.length ? 'Past their due date' : 'Everything on schedule',
            icon: AlertTriangle,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            title: 'Completion Rate',
            value: `${completion}%`,
            hint: `${doneTasks.length} of ${tasks.length} task(s) done`,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
        ],
        panels: [
          {
            id: 'pipeline',
            title: 'Task Pipeline',
            description: 'Workload spread across the board stages',
            icon: ListChecks,
            emptyLabel: 'No tasks on the board.',
            link: { label: 'Open task board', path: '/tasks' },
            items: INITIAL_KANBAN_STAGES.map((stage) => {
              const staged = tasks.filter((t) => t.status === stage.id);
              return {
                id: stage.id,
                title: stage.label,
                subtitle: staged.map((t) => t.title).slice(0, 2).join(' · ') || 'Empty stage',
                meta: `${staged.length} task(s)`,
                badge: { label: `${staged.length}`, variant: stage.badgeVariant as BadgeProps['variant'] },
              };
            }),
          },
          {
            id: 'blockers',
            title: 'Priority & Late Work',
            description: 'Tasks that need a decision first',
            icon: AlertTriangle,
            emptyLabel: 'No urgent or late tasks.',
            link: { label: 'Open task board', path: '/tasks' },
            items: urgentTasks.slice(0, 6).map((task) => ({
              id: task.id,
              title: task.title,
              subtitle: task.assigned_employee?.user?.name || 'Unassigned',
              meta: dueLabel(task.due_date),
              badge: { label: task.priority, variant: priorityVariant(task.priority) },
            })),
          },
          {
            id: 'projects',
            title: 'Project Health',
            description: 'Progress per project based on completed tasks',
            icon: FolderKanban,
            emptyLabel: 'No projects assigned.',
            link: { label: 'Open projects', path: '/projects' },
            items: projects.map((project) => {
              const projectTasks = tasks.filter((t) => t.project_id === project.id);
              const projectDone = projectTasks.filter((t) => t.status === 'done').length;
              const progress = projectTasks.length
                ? Math.round((projectDone / projectTasks.length) * 100)
                : 0;
              return {
                id: project.id,
                title: project.name,
                subtitle: `${projectDone}/${projectTasks.length} task(s) completed`,
                meta: project.end_date ? dueLabel(project.end_date) : 'Open ended',
                badge: { label: `${progress}%`, variant: progress >= 60 ? 'success' : 'warning' },
              };
            }),
          },
        ],
      };
    }

    /* ------------------------------------------------------------- ACCOUNTANT */
    case 'accountant': {
      const pendingQuotations = quotations.filter((q) => q.status === 'sent' || q.status === 'draft');
      const overdueAmount = overdueInvoices.reduce((sum, i) => sum + toNumber(i.total_amount), 0);

      return {
        subtitle: 'Accounts receivable: billing, settlements and open quotations.',
        kpis: [
          {
            title: 'Cash Collected',
            value: amount(settledAmount),
            hint: `${settledPayments.length} completed settlement(s)`,
            icon: Wallet,
            color: 'text-[#05AD98]',
            bg: 'bg-[#05AD98]/10',
          },
          {
            title: 'Outstanding',
            value: amount(outstandingAmount),
            hint: `${unpaidInvoices.length} unpaid invoice(s)`,
            icon: Receipt,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            title: 'Overdue',
            value: amount(overdueAmount),
            hint: `${overdueInvoices.length} invoice(s) past due`,
            icon: AlertTriangle,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
          },
          {
            title: 'Open Quotations',
            value: String(pendingQuotations.length),
            hint: amount(pendingQuotations.reduce((sum, q) => sum + toNumber(q.total_amount), 0)) + ' in the pipeline',
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
        ],
        panels: [
          {
            id: 'receivables',
            title: 'Invoices to Collect',
            description: 'Unpaid customer invoices by due date',
            icon: Receipt,
            emptyLabel: 'Every invoice has been settled.',
            link: { label: 'Open invoices', path: '/invoices' },
            items: unpaidInvoices
              .slice()
              .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
              .map((inv) => ({
                id: inv.id,
                title: `${inv.invoice_number} · ${customerLabel(inv.customer?.name, inv.customer?.company_name, inv.customer_id)}`,
                subtitle: amount(toNumber(inv.total_amount)),
                meta: dueLabel(inv.due_date),
                badge: { label: inv.status, variant: invoiceVariant(inv.status) },
              })),
          },
          {
            id: 'quotations',
            title: 'Quotation Pipeline',
            description: 'Estimates awaiting customer decision',
            icon: FileText,
            emptyLabel: 'No quotations in progress.',
            link: { label: 'Open quotations', path: '/quotations' },
            items: quotations.map((quote) => ({
              id: quote.id,
              title: `${quote.quotation_number || quote.reference || `QT-${quote.id}`} · ${customerLabel(quote.customer?.name, quote.customer?.company_name, quote.customer_id)}`,
              subtitle: amount(toNumber(quote.total_amount)),
              meta: quote.valid_until ? `Valid until ${quote.valid_until}` : 'No expiry',
              badge: { label: quote.status, variant: quotationVariant(quote.status) },
            })),
          },
          {
            id: 'payments',
            title: 'Recent Settlements',
            description: 'Latest Mobile Money, card and transfer activity',
            icon: CreditCard,
            emptyLabel: 'No payments recorded.',
            link: { label: 'Open payments', path: '/payments' },
            items: payments.map((payment) => ({
              id: payment.id,
              title: amount(toNumber(payment.amount)),
              subtitle: `${String(payment.method).replace(/_/g, ' ')} · ${payment.transaction_reference || payment.reference || '—'}`,
              meta: payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '—',
              badge: {
                label: payment.status,
                variant: payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger',
              },
            })),
          },
        ],
      };
    }

    /* --------------------------------------------------------------- CUSTOMER */
    case 'customer': {
      const profile = resolveCustomerProfile(user, MOCK_CUSTOMERS);
      const awaitingReview = quotations.filter((q) => q.status === 'sent');
      const nextDue = unpaidInvoices
        .slice()
        .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))[0];

      return {
        subtitle: profile
          ? `Client portal for ${profile.company_name || profile.name}. You only see your own documents.`
          : 'Client portal. Your account is not linked to a customer file yet.',
        kpis: [
          {
            title: 'Balance Due',
            value: amount(outstandingAmount),
            hint: `${unpaidInvoices.length} invoice(s) to settle`,
            icon: Receipt,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            title: 'Quotes to Review',
            value: String(awaitingReview.length),
            hint: awaitingReview.length ? 'Waiting for your approval' : 'Nothing to approve',
            icon: FileText,
            color: 'text-[#05AD98]',
            bg: 'bg-[#05AD98]/10',
          },
          {
            title: 'Total Paid',
            value: amount(settledAmount),
            hint: `${settledPayments.length} settled, ${pendingPayments.length} pending`,
            icon: CreditCard,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            title: 'Next Payment',
            value: nextDue ? dueLabel(nextDue.due_date) : 'None',
            hint: nextDue ? `${nextDue.invoice_number} · ${amount(toNumber(nextDue.total_amount))}` : 'No open invoice',
            icon: CalendarClock,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
        ],
        panels: [
          {
            id: 'my-invoices',
            title: 'My Invoices',
            description: 'Billing history for your account',
            icon: Receipt,
            emptyLabel: 'No invoices issued to your account.',
            link: { label: 'Open invoices', path: '/invoices' },
            items: invoices.map((inv) => ({
              id: inv.id,
              title: inv.invoice_number,
              subtitle: amount(toNumber(inv.total_amount)),
              meta: inv.status === 'paid' ? 'Settled' : dueLabel(inv.due_date),
              badge: { label: inv.status, variant: invoiceVariant(inv.status) },
            })),
          },
          {
            id: 'my-quotations',
            title: 'My Quotations',
            description: 'Estimates shared with your account',
            icon: FileText,
            emptyLabel: 'No quotations shared with you yet.',
            link: { label: 'Open quotations', path: '/quotations' },
            items: quotations.map((quote) => ({
              id: quote.id,
              title: quote.quotation_number || quote.reference || `QT-${quote.id}`,
              subtitle: amount(toNumber(quote.total_amount)),
              meta: quote.valid_until ? `Valid until ${quote.valid_until}` : 'No expiry',
              badge: { label: quote.status, variant: quotationVariant(quote.status) },
            })),
          },
          {
            id: 'my-payments',
            title: 'My Payments',
            description: 'Your settlement history',
            icon: CreditCard,
            emptyLabel: 'No payments recorded for your account.',
            link: { label: 'Open payments', path: '/payments' },
            items: payments.map((payment) => ({
              id: payment.id,
              title: amount(toNumber(payment.amount)),
              subtitle: String(payment.method).replace(/_/g, ' '),
              meta: payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '—',
              badge: {
                label: payment.status,
                variant: payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger',
              },
            })),
          },
        ],
      };
    }

    /* ------------------------------------------------ EMPLOYEE / INTERN / ELSE */
    default: {
      const profile = resolveEmployeeProfile(user, MOCK_EMPLOYEES);
      const presenceDate = latestAttendanceDate(attendance);
      const todayRecord = attendance.find((a) => a.date === presenceDate);
      const dueSoon = openTasks.filter((t) => {
        const remaining = daysUntil(t.due_date);
        return remaining !== null && remaining >= 0 && remaining <= 7;
      });

      return {
        subtitle: profile
          ? `${profile.job_title} · ${profile.department?.name || 'Unassigned department'}. Your personal workload only.`
          : 'Your personal workspace. No employee file is linked to this account yet.',
        kpis: [
          {
            title: 'My Open Tasks',
            value: String(openTasks.length),
            hint: `${openTasks.filter((t) => t.status === 'in_progress').length} in progress`,
            icon: CheckSquare,
            color: 'text-[#05AD98]',
            bg: 'bg-[#05AD98]/10',
          },
          {
            title: 'Due This Week',
            value: String(dueSoon.length),
            hint: overdueTasks.length ? `${overdueTasks.length} already late` : 'Nothing late',
            icon: CalendarClock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            title: 'Attendance',
            value: todayRecord ? todayRecord.status : 'Not checked in',
            hint: todayRecord
              ? `${todayRecord.check_in_time || '—'} at ${todayRecord.location || 'unknown site'}`
              : 'Use the attendance module to check in',
            icon: Clock,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            title: 'My Projects',
            value: String(projects.length),
            hint: projects.map((p) => p.name).slice(0, 2).join(', ') || 'No project assignment',
            icon: FolderKanban,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
        ],
        panels: [
          {
            id: 'my-tasks',
            title: 'My Tasks',
            description: 'Assignments sorted by due date',
            icon: CheckSquare,
            emptyLabel: 'No tasks are assigned to you.',
            link: { label: 'Open task board', path: '/tasks' },
            items: openTasks
              .slice()
              .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
              .map((task) => ({
                id: task.id,
                title: task.title,
                subtitle: `${stageLabel(String(task.status))} · ${MOCK_PROJECTS.find((p) => p.id === task.project_id)?.name || 'No project'}`,
                meta: dueLabel(task.due_date),
                badge: { label: task.priority, variant: priorityVariant(task.priority) },
              })),
          },
          {
            id: 'my-attendance',
            title: 'My Attendance',
            description: 'Your latest check-in records',
            icon: Clock,
            emptyLabel: 'No attendance recorded for your account.',
            link: { label: 'Open attendance', path: '/attendance' },
            items: attendance
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 5)
              .map((record) => ({
                id: record.id,
                title: record.date,
                subtitle: record.location,
                meta: `${record.check_in_time || '—'} → ${record.check_out_time || 'still in'}`,
                badge: { label: record.status, variant: attendanceVariant(record.status) },
              })),
          },
          {
            id: 'my-projects',
            title: 'My Projects',
            description: 'Teams you are a member of',
            icon: FolderKanban,
            emptyLabel: 'You are not part of a project team yet.',
            items: projects.map((project) => {
              const membership = project.members?.find((m) => m.employee_id === profile?.id);
              return {
                id: project.id,
                title: project.name,
                subtitle: membership?.role || 'Contributor',
                meta: project.end_date ? dueLabel(project.end_date) : 'Open ended',
              };
            }),
          },
        ],
      };
    }
  }
};
