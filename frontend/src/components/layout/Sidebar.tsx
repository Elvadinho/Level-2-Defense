import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNavGroupsForRole } from '../../config/navigation';
import { Badge } from '../common/Badge';
import { X, Sparkles } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Responsive Navigation Sidebar Component
 * Adapts visible modules dynamically according to authenticated user role
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navGroups = getNavGroupsForRole(user?.role);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#BBBFBF]/40
          flex flex-col transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#BBBFBF]/30 bg-white">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 focus:outline-none">
            {/* Vichy Modern Logo Mark */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#05AD98] to-[#037667] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg tracking-tight text-slate-900">Modoo</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#05AD98] bg-[#05AD98]/10 px-1.5 py-0.2 rounded">
                  ERP
                </span>
              </div>
              <p className="text-[10px] text-[#878787] font-medium leading-none">Enterprise Suite</p>
            </div>
          </NavLink>

          {/* Close button for Mobile Screens */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Role Filtered) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#878787]">
                {group.title}
              </h3>

              <div className="mt-1.5 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => `
                        group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150
                        ${
                          isActive
                            ? 'bg-[#05AD98]/10 text-[#049381] font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive
                                ? 'text-[#05AD98]'
                                : 'text-[#878787] group-hover:text-slate-800'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>

                          {item.id === 'ai-assistant' && (
                            <Sparkles className="w-3.5 h-3.5 ml-auto text-[#05AD98] animate-pulse" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Role Card at bottom of sidebar */}
        {user && (
          <div className="p-4 border-t border-[#BBBFBF]/30 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#05AD98]/15 border border-[#05AD98]/30 text-[#037667] font-semibold flex items-center justify-center text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                <div className="mt-0.5">
                  <Badge role={user.role} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
