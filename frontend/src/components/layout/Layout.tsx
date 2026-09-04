import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

/**
 * Main Application Layout
 * Provides responsive multi-screen layout with fixed/collapsible sidebar and sticky header
 */
export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Role-tailored Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
