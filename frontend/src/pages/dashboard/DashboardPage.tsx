import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNavItemsForRole } from '../../config/navigation';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { buildRoleDashboard, QUICK_ACTION_MODULES } from './dashboardData';
import { ArrowUpRight, ArrowRight, Inbox } from 'lucide-react';

/**
 * DashboardPage Component
 * Odoo-inspired command center rendering only the metrics, records and shortcuts
 * that the authenticated role is allowed to access.
 */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modules granted to this role (single source of truth for links and shortcuts)
  const allowedModules = useMemo(() => getNavItemsForRole(user?.role), [user?.role]);
  const accessibleModules = allowedModules.filter((m) => m.id !== 'dashboard');

  // Quick actions are intersected with granted modules so no forbidden link is offered
  const quickActions = useMemo(() => {
    const preferred = user?.role ? QUICK_ACTION_MODULES[user.role] || [] : [];
    return preferred
      .map((id) => accessibleModules.find((m) => m.id === id))
      .filter((item): item is (typeof accessibleModules)[number] => Boolean(item))
      .slice(0, 3);
  }, [user?.role, accessibleModules]);

  const dashboard = useMemo(() => buildRoleDashboard(user), [user]);

  // Panel links must also respect the granted modules
  const allowedPaths = new Set(allowedModules.map((m) => m.path));

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

          <p className="mt-1 text-xs text-slate-500 max-w-2xl">{dashboard.subtitle}</p>
        </div>

        {quickActions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant={idx === 0 ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => navigate(action.path)}
                  leftIcon={<Icon className={`w-3.5 h-3.5 ${idx === 0 ? '' : 'text-[#05AD98]'}`} />}
                >
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboard.kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-[#05AD98]/50 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{kpi.title}</span>
                <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight capitalize">{kpi.value}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{kpi.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role-specific operational panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {dashboard.panels.map((panel) => {
          const PanelIcon = panel.icon;
          const canFollowLink = panel.link && allowedPaths.has(panel.link.path);

          return (
            <div
              key={panel.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-50 text-[#05AD98] border border-slate-200">
                    <PanelIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 truncate">{panel.title}</h2>
                    {panel.description && (
                      <p className="text-[11px] text-slate-400 truncate">{panel.description}</p>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                  {panel.items.length}
                </span>
              </div>

              <div className="flex-1 divide-y divide-slate-100">
                {panel.items.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <Inbox className="w-6 h-6 mx-auto text-slate-300" />
                    <p className="text-xs text-slate-400">{panel.emptyLabel}</p>
                  </div>
                ) : (
                  panel.items.slice(0, 6).map((item) => (
                    <div key={item.id} className="px-4 py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                        {item.badge && (
                          <Badge variant={item.badge.variant} size="sm">
                            {item.badge.label}
                          </Badge>
                        )}
                        {item.meta && (
                          <span className="text-[10px] text-slate-400 font-medium">{item.meta}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canFollowLink && panel.link && (
                <button
                  type="button"
                  onClick={() => navigate(panel.link!.path)}
                  className="px-4 py-2.5 border-t border-slate-100 text-[11px] font-semibold text-[#05AD98] hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer rounded-b-xl"
                >
                  <span>{panel.link.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
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

        {accessibleModules.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Inbox className="w-7 h-7 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No modules assigned yet</p>
            <p className="text-xs text-slate-400">
              Contact your administrator to get access to the workspaces you need.
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
