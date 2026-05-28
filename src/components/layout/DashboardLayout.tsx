import React from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium px-3 py-1.5 rounded-lg transition ${
    isActive ? 'bg-primary-50 text-primary-800' : 'text-slate-600 hover:bg-slate-100'
  }`;

const DashboardLayout: React.FC = () => {
  const { isConnected } = useSocket();
  const { logout, hasPermission, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isManageActive = location.pathname.startsWith('/manage');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 min-h-14 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6 min-w-0">
            <Link to="/jobs" className="flex items-center gap-3 min-w-0 shrink-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-bold">
                LB
              </span>
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-sm font-semibold text-slate-900 leading-tight">LazyBidder</h1>
                <p className="text-xs text-slate-500 truncate">Jobs & companies</p>
              </div>
            </Link>

            <nav className="flex items-center gap-1 flex-wrap">
              <NavLink to="/analytics" className={navClass}>
                Analytics
              </NavLink>
              <NavLink to="/jobs" className={navClass}>
                Jobs
              </NavLink>
              <NavLink to="/companies" className={navClass}>
                Companies
              </NavLink>
              {hasPermission('manage_extensions') ? (
                <NavLink to="/extensions" className={navClass}>
                  Extensions
                </NavLink>
              ) : null}
              {hasPermission('manage_users') ||
              hasPermission('manage_api_keys') ||
              hasPermission('manage_actions') ? (
                <NavLink to="/manage/users" className={() => navClass({ isActive: isManageActive })}>
                  Manage
                </NavLink>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium shrink-0">
            <span className="hidden md:inline text-slate-500">
              {user?.username ?? 'Unknown'} ({user?.role ?? 'user'})
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ring-inset ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : 'bg-red-50 text-red-700 ring-red-600/20'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}
              />
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
};

export default DashboardLayout;
