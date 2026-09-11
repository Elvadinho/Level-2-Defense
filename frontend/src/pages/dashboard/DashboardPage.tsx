import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNavItemsForRole } from '../../config/navigation';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Users,
  FolderKanban,
  CheckSquare,
  Receipt,
  CreditCard,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Building2,
} from 'lucide-react';

/**
 * DashboardPage Component
 * Odoo-inspired clean operational command center and modular app launcher
 */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Accessible modules for this role
  const accessibleModules = getNavItemsForRole(user?.role).filter((m) => m.id !== 'dashboard');

  // KPI Metrics generation tailored to user role
  const getKpiCards = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { title: 'Total Employees', value: '6', change: '5 Departments active', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Active Projects', value: '3', change: '17 tasks total', icon: FolderKanban, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Total Invoiced', value: '23,700,000 XAF', change: '14,500,000 XAF collected', icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'AI Assistant', value: 'Ready', change: '100% operational', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
        ];
      case 'hr_manager':
        return [
          { title: 'Total Staff', value: '6', change: '100% active roster', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: "Today's Attendance", value: '100%', change: '5 checked in on site', icon: Clock, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Departments', value: '5', change: 'Executive, Engineering, HR...', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Leave Requests', value: '0', change: 'All schedules updated', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
        ];
      case 'project_manager':
        return [
          { title: 'Active Projects', value: '3', change: 'All on schedule', icon: FolderKanban, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Active Tasks', value: '8', change: '3 in progress, 1 review', icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Team Members', value: '6', change: '3 cross-functional teams', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { title: 'Milestone Completion', value: '85%', change: '+12% this sprint', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ];
      case 'accountant':
        return [
          { title: 'Total Revenue', value: '17,900,000 XAF', change: 'Settled this quarter', icon: TrendingUp, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Unpaid Invoices', value: '2', change: '9,200,000 XAF pending', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'Settled Payments', value: '17,900,000 XAF', change: 'Orange & MTN Mobile Money', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Active Quotations', value: '3', change: '1 Approved, 1 Sent, 1 Draft', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ];
      case 'customer':
        return [
          { title: 'My Invoices', value: '3', change: '1 pending settlement', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'Active Quotations', value: '2', change: 'Awaiting your review', icon: CheckSquare, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Completed Payments', value: '17,900,000 XAF', change: 'Mobile Money / Card', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'AI Assistant', value: 'Active', change: '24/7 Account support', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
        ];
      case 'employee':
      default:
        return [
          { title: 'My Open Tasks', value: '4', change: '2 in progress', icon: CheckSquare, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Attendance Status', value: 'Present', change: 'Clocked in at 08:02', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Assigned Projects', value: '2', change: 'Enterprise Core, Mobile App', icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'AI Assistant Prompts', value: 'Active', change: 'Daily assistant available', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
        ];
    }
  };

  const kpis = getKpiCards();

  return (
    <div className="space-y-5">
      {/* Top Banner: Greeting & Role Overview */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge role={user?.role} size="md" />
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, <span className="text-[#05AD98]">{user?.name}</span>
          </h1>

          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Modoo ERP operational workspace. All modules, database records, and business workflows are running smoothly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/tasks')}
            leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
          >
            Open Tasks Board
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/assistant')}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#05AD98]" />}
          >
            AI Assistant
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-[#05AD98]/50 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{kpi.title}</span>
                <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{kpi.value}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{kpi.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Odoo-style App Launcher Modules Grid */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">ERP Applications & Workspaces</h2>
            <p className="text-xs text-slate-400">Launch business management modules assigned to your role</p>
          </div>
          <span className="text-xs font-semibold text-[#05AD98]">
            {accessibleModules.length} Modules Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {accessibleModules.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => navigate(item.path)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#05AD98]/60 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#05AD98] group-hover:bg-[#05AD98] group-hover:text-white group-hover:border-[#05AD98] transition-all shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#05AD98] transition-colors" />
                </div>

                <div>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#05AD98] transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {item.description || `Manage ${item.label.toLowerCase()} workflows`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
