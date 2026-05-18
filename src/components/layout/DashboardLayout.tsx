import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';

const DashboardLayout: React.FC = () => {
  const { isConnected } = useSocket();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-bold">
              LB
            </span>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-slate-900 leading-tight">LazyBidder</h1>
              <p className="text-xs text-slate-500 truncate">Extension control</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium">
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
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
};

export default DashboardLayout;
