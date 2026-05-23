import React from 'react';
import PageHeader from './PageHeader';
import { NavLink, Outlet } from 'react-router-dom';

const sideNavClass = ({ isActive }: { isActive: boolean }) =>
  `block text-sm font-medium px-3 py-2 rounded-lg transition ${
    isActive ? 'bg-primary-50 text-primary-800' : 'text-slate-600 hover:bg-slate-100'
  }`;

const ManageLayout: React.FC = () => {
  return (
    <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
      <PageHeader title="Manage" as="h2" />

      <div className="flex flex-col sm:flex-row gap-8">
        <aside className="sm:w-48 shrink-0">
          <nav className="flex sm:flex-col gap-1">
            <NavLink to="/manage/users" className={sideNavClass}>
              Users
            </NavLink>
            <NavLink to="/manage/api-keys" className={sideNavClass}>
              API keys
            </NavLink>
            <NavLink to="/manage/actions" className={sideNavClass}>
              Actions
            </NavLink>
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
};

export default ManageLayout;
