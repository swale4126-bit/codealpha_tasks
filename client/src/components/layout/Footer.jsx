import { Link } from 'react-router-dom';
import { ShieldCheck, ShoppingBag } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-slate-900">
                Kora<span className="text-brand-500">Market</span>
              </span>
            </Link>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
              Thoughtfully curated electronics, ergonomic workspace tools, minimalist home goods,
              and everyday essentials—built with transparent pricing and dependable fulfillment.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Demo Store: Supports Cash on Delivery & Simulated Test Checkout
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Shop</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
              <li>
                <Link to="/products" className="hover:text-brand-600">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=electronics-audio" className="hover:text-brand-600">
                  Electronics & Audio
                </Link>
              </li>
              <li>
                <Link to="/products?category=workspace-tech" className="hover:text-brand-600">
                  Workspace & Tech
                </Link>
              </li>
              <li>
                <Link to="/products?category=home-living" className="hover:text-brand-600">
                  Home & Living
                </Link>
              </li>
              <li>
                <Link to="/products?category=kitchen-coffee" className="hover:text-brand-600">
                  Kitchen & Coffee
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Account</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
              <li>
                <Link to="/profile" className="hover:text-brand-600">
                  My Profile & Addresses
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-brand-600">
                  Order History
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-brand-600">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-600">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-stone-200 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} KoraMarket. CodeAlpha Full-Stack Internship Project.</p>
          <p>React + Express + PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
