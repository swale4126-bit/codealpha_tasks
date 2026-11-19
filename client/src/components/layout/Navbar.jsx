import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth.js';
import useCart from '../../hooks/useCart.js';
import useToast from '../../hooks/useToast.js';

export default function Navbar({ cartCount, onOpenCart }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart, openDrawer } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayCount = cartCount !== undefined ? cartCount : cart.itemCount;
  const handleCartClick = onOpenCart || openDrawer;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    navigate(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : '/products');
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    toast.info('You have been signed out.');
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-brand-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            Kora<span className="text-brand-500">Market</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary navigation">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/products" className={navLinkClass}>
            Shop All
          </NavLink>
          <NavLink to="/products?featured=true" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Featured
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        {/* Desktop Search */}
        <form onSubmit={handleSearchSubmit} className="hidden max-w-sm flex-1 lg:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search headphones, desks, coffee..."
              aria-label="Search products"
              className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Button */}
          <button
            type="button"
            onClick={handleCartClick}
            aria-label={`Shopping cart (${displayCount} items)`}
            className="relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-stone-50"
          >
            <ShoppingBag className="h-4 w-4 text-brand-600" />
            <span className="hidden sm:inline">Cart</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
              {displayCount}
            </span>
          </button>

          {/* Desktop Auth Controls */}
          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-medium text-slate-800 hover:bg-stone-100"
                >
                  <User className="h-4 w-4 text-brand-600" />
                  <span className="max-w-28 truncate">{user.fullName.split(' ')[0]}</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    title="Admin Dashboard"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-slate-700 hover:bg-stone-50"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-stone-200 text-slate-600 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center rounded-xl px-3.5 text-sm font-semibold text-slate-700 hover:bg-stone-100"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-stone-200 text-slate-700 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-stone-200 bg-white px-4 pt-3 pb-5 md:hidden">
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pr-4 pl-10 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
              />
            </div>
          </form>

          <div className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-stone-100"
            >
              Home
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-stone-100"
            >
              Shop All Products
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-stone-100"
                >
                  <User className="h-4 w-4 text-brand-600" />
                  Profile & Addresses
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-stone-100"
                >
                  <Package className="h-4 w-4 text-brand-600" />
                  My Orders
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 items-center justify-center rounded-xl border border-stone-300 text-sm font-semibold text-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 items-center justify-center rounded-xl bg-brand-500 text-sm font-semibold text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
