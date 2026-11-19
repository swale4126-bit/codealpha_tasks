import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Truck, X } from 'lucide-react';
import useCart from '../../hooks/useCart.js';
import { formatCurrency } from '../../utils/formatters.js';
import Button from '../common/Button.jsx';
import CartItemRow from './CartItemRow.jsx';

export default function CartDrawer() {
  const { cart, isDrawerOpen, closeDrawer, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const freeShippingThreshold = 100;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cart.subtotal);
  const freeShippingPct = Math.min(100, Math.round((cart.subtotal / freeShippingThreshold) * 100));

  const handleGoToCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const handleGoToCart = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Cart Drawer"
          className="flex w-screen max-w-md flex-col bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-brand-600" />
              <h2 className="font-display text-lg font-bold text-slate-900">Your Cart</h2>
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                {cart.itemCount}
              </span>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close cart drawer"
              className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-stone-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Free Shipping Progress Helper */}
          <div className="border-b border-stone-100 bg-brand-50/60 px-6 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-brand-800">
              <Truck className="h-4 w-4 shrink-0 text-brand-600" />
              {remainingForFreeShipping > 0 ? (
                <span>
                  Add <strong className="font-bold">{formatCurrency(remainingForFreeShipping)}</strong> more to get Free Standard Shipping!
                </span>
              ) : (
                <span className="font-bold text-emerald-800">
                  You have unlocked Free Standard Shipping!
                </span>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${freeShippingPct}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 divide-y divide-stone-100">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">Your cart is empty</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Explore our curated collections and add something special.
                </p>
                <Link
                  to="/products"
                  onClick={closeDrawer}
                  className="mt-5 inline-flex h-9 items-center rounded-xl bg-brand-500 px-4 text-xs font-semibold text-white hover:bg-brand-600"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              cart.items.map((item) => (
                <CartItemRow
                  key={item.itemId || item.productId}
                  item={item}
                  compact
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))
            )}
          </div>

          {/* Footer Totals & CTAs */}
          {cart.items.length > 0 && (
            <div className="border-t border-stone-200 bg-stone-50/70 p-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-display font-bold text-slate-900">
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Shipping</span>
                <span>
                  {cart.shippingFee === 0 ? (
                    <strong className="font-semibold text-emerald-700">FREE</strong>
                  ) : (
                    formatCurrency(cart.shippingFee)
                  )}
                </span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex items-center justify-between text-base">
                <span className="font-bold text-slate-900">Estimated Total</span>
                <span className="font-display text-lg font-extrabold text-slate-900">
                  {formatCurrency(cart.totalAmount)}
                </span>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2.5">
                <Button variant="outline" onClick={handleGoToCart}>
                  View Cart
                </Button>
                <Button onClick={handleGoToCheckout}>
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
