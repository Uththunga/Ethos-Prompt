import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const ADMIN_NAV_ITEMS = [
  { name: 'Quotations', to: '/admin/quotations' },
  { name: 'Contacts', to: '/admin/contacts' },
  { name: 'My Contacts', to: '/admin/my-contacts' },
  { name: 'Email Templates', to: '/admin/email-templates' },
  { name: 'Sequences', to: '/admin/email-sequences' },
  { name: 'Email Jobs', to: '/admin/email-jobs' },
];

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-ethos-offwhite">
      <aside className="w-56 lg:w-64 border-r border-ethos-gray-light/40 bg-white/90 backdrop-blur-sm">
        <div className="px-4 py-4 border-b border-ethos-gray-light/30">
          <div className="text-xs font-semibold tracking-wide text-ethos-gray uppercase">Admin</div>
          <div className="mt-1 text-sm font-bold text-ethos-navy">Contact Management</div>
        </div>
        <nav className="mt-2 px-2 space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ethos-purple text-white shadow-sm'
                    : 'text-ethos-navy hover:bg-ethos-purple/5 hover:text-ethos-purple'
                }`
              }
            >
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
