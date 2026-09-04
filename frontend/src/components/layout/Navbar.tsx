import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Menu, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
}

/**
 * Top Navbar component for global actions, search, and user profile management
 */
export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-[#BBBFBF]/40 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left Section: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#878787]">
          <span className="font-medium text-slate-700">Modoo</span>
          <span>/</span>
          <span className="text-[#05AD98] font-semibold">Workspace</span>
        </div>
      </div>

      {/* Right Section: Role Status, User Profile & Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user && (
          <>
            {/* Role Badge Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#05AD98]" />
              <Badge role={user.role} size="sm" />
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#05AD98] text-white font-semibold flex items-center justify-center text-xs shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-[#878787] truncate max-w-[150px]">{user.email}</p>
              </div>
            </div>

            {/* Logout Action Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 focus:outline-none cursor-pointer"
              title="Sign out of your account"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
