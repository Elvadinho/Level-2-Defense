import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNavGroupsForRole } from '../../config/navigation';
import { Badge } from '../common/Badge';
import { X, Sparkles } from 'lucide-react';
import { ModooLogo } from '../common/ModooLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Responsive Navigation Sidebar Component
 * Adapts visible modules dynamically according to authenticated user role
 * Fixed/Sticky on desktop and slide-out drawer on mobile screens
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navGroups = getNavGroupsForRole(user?.role);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container - Sticky & Fixed on Desktop, Slide-over on Mobile */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-50/90 border-r border-slate-200
          flex flex-col h-screen flex-shrink-0 transition-all duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0 shadow-2xl bg-white' : '-translate-x-full lg:shadow-none'}
        `}
      >
        {/* Brand Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200 bg-white">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 focus:outline-none">
            {/* Vichy Modern Logo Mark */}
            <ModooLogo size={28} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">Modoo</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[#05AD98] bg-[#05AD98]/10 px-1.5 py-0.5 rounded">
                  ERP
                </span>
              </div>
            </div>
          </NavLink>

          {/* Close button for Mobile Screens */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Role Filtered) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </h3>

              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => `
                        group flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150
                        ${
                          isActive
                            ? 'bg-[#05AD98] text-white font-semibold shadow-xs'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-500 group-hover:text-slate-800'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>

                          {item.id === 'ai-assistant' && (
                            <Sparkles className={`w-3.5 h-3.5 ml-auto ${isActive ? 'text-white' : 'text-[#05AD98]'}`} />
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
          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#05AD98]/15 border border-[#05AD98]/30 text-[#037667] font-semibold flex items-center justify-center text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
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
