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
  ShieldCheck,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';

/**
 * DashboardPage Component
 * Role-aware operational command center built with the Vichy color palette
 */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Allowed modules for this user
  const accessibleModules = getNavItemsForRole(user?.role).filter((m) => m.id !== 'dashboard');

  // KPI Metrics generation tailored to user role
  const getKpiCards = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { title: 'Total Employees', value: '28', change: '+3 this month', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Active Projects', value: '12', change: '4 near deadline', icon: FolderKanban, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Pending Invoices', value: '$45,280', change: '8 unpaid', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'AI Assistant Queries', value: '154', change: '99.4% resolved', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
        ];
      case 'hr_manager':
        return [
          { title: 'Active Staff', value: '28', change: '100% active', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: "Today's Attendance", value: '92.8%', change: '26 checked in', icon: Clock, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Departments', value: '5', change: 'Engineering, HR, Sales...', icon: FolderKanban, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Leave Requests', value: '2', change: 'Pending review', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
        ];
      case 'project_manager':
        return [
          { title: 'Active Projects', value: '6', change: '2 on schedule', icon: FolderKanban, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Assigned Tasks', value: '43', change: '18 in progress', icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Team Members', value: '14', change: '3 teams', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { title: 'Milestone Velocity', value: '88%', change: '+5% vs last sprint', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ];
      case 'accountant':
        return [
          { title: 'Total Revenue', value: '$124,500', change: '+12% QoQ', icon: TrendingUp, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Unpaid Invoices', value: '8', change: '$18,400 pending', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'NotchPay Volume', value: '$52,100', change: 'Orange & MTN MoMo', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Active Quotations', value: '14', change: '5 awaiting client approval', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ];
      case 'customer':
        return [
          { title: 'My Invoices', value: '3', change: '1 pending payment', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'Active Quotations', value: '2', change: 'Awaiting your review', icon: CheckSquare, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Completed Payments', value: '$8,450', change: 'via NotchPay', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Support Inquiries', value: '0', change: 'All resolved', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
        ];
      case 'employee':
      default:
        return [
          { title: 'My Open Tasks', value: '7', change: '2 due today', icon: CheckSquare, color: 'text-[#05AD98]', bg: 'bg-[#05AD98]/10' },
          { title: 'Attendance Status', value: 'Present', change: 'Checked in at 08:30', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Completed This Week', value: '12', change: '94% on time', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'AI Assistant Prompts', value: '18', change: 'Code & workflow helper', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
        ];
    }
  };

  const kpis = getKpiCards();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Greeting & Role Overview */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#BBBFBF]/30 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge role={user?.role} size="md" />
            <span className="text-xs text-[#878787] font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, <span className="text-[#05AD98]">{user?.name}</span>
          </h1>

          <p className="mt-1 text-sm text-[#878787] max-w-2xl">
            Here is your daily operational briefing. All active modules, services, and AI assistance
            are running with high availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/assistant')}
            leftIcon={<Sparkles className="w-4 h-4 text-[#05AD98]" />}
          >
            Ask AI Assistant
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/tasks')}
          >
            View Tasks
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 border border-[#BBBFBF]/30 shadow-subtle hover:shadow-card transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#878787]">
                  {kpi.title}
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</p>
                <p className="mt-1 text-xs text-[#878787] flex items-center gap-1 font-medium">
                  <span className="text-[#05AD98]">●</span> {kpi.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible Modules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Active Modules</h2>
            <p className="text-xs text-[#878787]">
              Modules enabled for your <strong className="text-slate-700">{user?.role}</strong> role
            </p>
          </div>
          <span className="text-xs text-[#878787] bg-slate-100 px-2.5 py-1 rounded-full font-medium">
            {accessibleModules.length} Modules Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessibleModules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.id}
                onClick={() => navigate(module.path)}
                className="group bg-white rounded-2xl p-5 border border-[#BBBFBF]/30 shadow-subtle hover:shadow-card hover:border-[#05AD98]/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#05AD98]/10 text-[#05AD98] flex items-center justify-center group-hover:bg-[#05AD98] group-hover:text-white transition-all shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#878787] group-hover:text-[#05AD98] transition-colors" />
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-[#05AD98] transition-colors">
                    {module.label}
                  </h3>
                  <p className="mt-1 text-xs text-[#878787] leading-relaxed">
                    {module.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#878787]">
                  <span className="font-medium">Open Module</span>
                  <span className="text-[#05AD98] font-semibold">Access Ready →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backend & AI Integration Status */}
      <div className="bg-white rounded-2xl p-5 border border-[#BBBFBF]/30 shadow-subtle">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] mb-3">
          Architecture & System Integration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <ShieldCheck className="w-5 h-5 text-[#05AD98] shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">Laravel 13 REST API</p>
              <p className="text-[#878787] text-[11px]">Sanctum Auth & SOLID Controllers</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <Sparkles className="w-5 h-5 text-[#05AD98] shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">NVIDIA GPT-OSS 20B</p>
              <p className="text-[#878787] text-[11px]">NIM API MoE AI Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <CreditCard className="w-5 h-5 text-[#05AD98] shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">NotchPay Multi-Gateway</p>
              <p className="text-[#878787] text-[11px]">Orange Money, MTN MoMo & Card</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
