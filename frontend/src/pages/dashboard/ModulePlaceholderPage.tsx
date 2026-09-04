import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ALL_NAV_ITEMS } from '../../config/navigation';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  Plus,
  Filter,
  Download,
  Search,
  CheckCircle2,
} from 'lucide-react';

/**
 * ModulePlaceholderPage
 * Provides a responsive UI container and workspace for individual ERP modules
 */
export const ModulePlaceholderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Find module metadata matching current path
  const currentModule = ALL_NAV_ITEMS.find((item) => item.path === location.pathname) || {
    id: 'module',
    label: 'Module Workspace',
    description: 'Operational business domain module',
    roles: [],
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Module Navigation Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#BBBFBF]/30 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1 rounded-lg text-[#878787] hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#878787] font-medium">Workspace</span>
            <span className="text-xs text-[#878787]">/</span>
            <span className="text-xs font-semibold text-[#05AD98]">{currentModule.label}</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentModule.label}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#878787]">
            {currentModule.description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="w-3.5 h-3.5" />}
          >
            Filter
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New {currentModule.label.replace(/s$/, '')}
          </Button>
        </div>
      </div>

      {/* Search and Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-[#BBBFBF]/30 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#878787]" />
          <input
            type="text"
            placeholder={`Search in ${currentModule.label.toLowerCase()}...`}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-[#BBBFBF] focus:border-[#05AD98] focus:ring-2 focus:ring-[#05AD98]/20 focus:outline-none transition-all placeholder-[#878787]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge role={user?.role} size="sm" />
          <span className="text-xs text-[#878787]">Active session</span>
        </div>
      </div>

      {/* Module Content & Data Table Container */}
      <div className="bg-white rounded-2xl border border-[#BBBFBF]/30 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">{currentModule.label} Records</h2>
            <p className="text-xs text-[#878787]">
              Real-time synchronization with Laravel REST API endpoints
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#05AD98]/10 text-[#049381] border border-[#05AD98]/20">
            Connected to Backend
          </span>
        </div>

        {/* Demo Data Rows */}
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors text-xs sm:text-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-[#BBBFBF]/40 flex items-center justify-center text-slate-700 font-semibold text-xs">
                  #{item.toString().padStart(3, '0')}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {currentModule.label.replace(/s$/, '')} Item #{item}
                  </p>
                  <p className="text-[11px] text-[#878787]">
                    Updated by {user?.name || 'Administrator'} • 2 hours ago
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Synchronized
                </span>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-[#878787]">
          <span>Showing 4 active records</span>
          <span className="text-[#05AD98] font-medium cursor-pointer hover:underline">
            Load More Records
          </span>
        </div>
      </div>
    </div>
  );
};
