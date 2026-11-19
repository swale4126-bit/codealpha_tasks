import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  ChevronRight,
  FolderTree,
  LogOut,
  Menu,
  Shield,
  ShoppingBag,
  Store,
  Users,
  X,
} from 'lucide-react';
import useAuth from '../hooks/useAuth.js';
import useToast from '../hooks/useToast.js';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Admin session ended.');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/admin', icon: BarChart3, end: true },
    { name: 'Orders', to: '/admin/orders', icon: ShoppingBag },
    { name: 'Products', to: '/admin/products', icon: Boxes },
    { name: 'Categories', to: '/admin/categories', icon: FolderTree },
    { name: 'Customers', to: '/admin/customers', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-stone-100/70 font-sans text-slate-800">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-stone-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between border-b border-stone-200 px-6">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                Kora<span className="text-brand-500">Admin</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Control Hub
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:text-slate-600 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6" aria-label="Admin Navigation">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Operations
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 font-semibold text-brand-600'
                      : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-6">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Shortcuts
            </p>
            <Link
              to="/"
              className="mt-1 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:bg-stone-50 hover:text-slate-900"
            >
              <Store className="h-4 w-4" />
              <span>Customer Storefront</span>
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </nav>

        {/* Admin User Info & Logout */}
        <div className="border-t border-stone-200 p-4">
          <div className="mb-3 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">{user?.fullName}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="cursor-pointer rounded-lg p-1.5 text-slate-600 hover:bg-stone-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Online
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-stone-100"
            >
              <Store className="h-3.5 w-3.5 text-brand-600" />
              View Store
            </Link>
          </div>
        </header>

        {/* Page View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
