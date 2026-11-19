import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth.js';
import useCart from '../../hooks/useCart.js';
import useToast from '../../hooks/useToast.js';
import { getAddresses, createAddress } from '../../services/addressService.js';
import { createOrderRequest } from '../../services/orderService.js';
import { extractApiError, formatCurrency } from '../../utils/formatters.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { LoadingSpinner } from '../../components/common/StateBlocks.jsx';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    recipientName: user?.fullName || '',
    phone: user?.phone || '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const [paymentMethod, setPaymentMethod] = useState('simulated_card');
  const [notes, setNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    getAddresses()
      .then((list) => {
        setAddresses(list);
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else {
          setShowNewAddressForm(true);
        }
      })
      .catch((err) => {
        toast.error(extractApiError(err, 'Failed to load shipping addresses.'));
      })
      .finally(() => setLoadingInitial(false));
  }, [toast]);

  if (loadingInitial) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <LoadingSpinner label="Preparing your checkout session..." />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-stone-400" />
        <h2 className="mt-4 font-display text-xl font-bold text-slate-900">Your cart is empty</h2>
        <p className="mt-2 text-sm text-slate-500">
          Add some products to your cart before proceeding to checkout.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    let finalAddressId = selectedAddressId;
    let finalShippingAddress = null;

    if (showNewAddressForm || !selectedAddressId) {
      if (
        !newAddress.recipientName ||
        !newAddress.phone ||
        !newAddress.streetLine1 ||
        !newAddress.city ||
        !newAddress.state ||
        !newAddress.postalCode
      ) {
        toast.error('Please complete all required shipping address fields.');
        return;
      }

      try {
        const saved = await createAddress(newAddress);
        finalAddressId = saved.id;
      } catch (err) {
        toast.error(extractApiError(err, 'Could not save new shipping address.'));
        return;
      }
    }

    setPlacingOrder(true);
    try {
      const order = await createOrderRequest({
        addressId: finalAddressId || undefined,
        shippingAddress: finalShippingAddress || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      await refreshCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${order.id}/confirmation`);
    } catch (err) {
      toast.error(extractApiError(err, 'Order placement failed.'));
      setPlacingOrder(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-stone-200 pb-6">
        <h1 className="font-display text-3xl font-extrabold text-slate-900">Checkout</h1>
        <p className="mt-1 text-sm text-slate-500">
          Complete your order with transparent fulfillment and simulated payment.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Form: Shipping + Payment */}
        <div className="space-y-8 lg:col-span-7">
          {/* 1. Shipping Address */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
                  1
                </div>
                <h2 className="font-display text-lg font-bold text-slate-900">Shipping Address</h2>
              </div>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm((v) => !v)}
                  className="cursor-pointer text-xs font-semibold text-brand-600 hover:underline"
                >
                  {showNewAddressForm ? 'Select Saved Address' : '+ New Address'}
                </button>
              )}
            </div>

            {!showNewAddressForm && addresses.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          {addr.label}
                        </span>
                        {addr.isDefault && <Badge variant="brand">Default</Badge>}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{addr.recipientName}</p>
                      <p className="text-xs text-slate-600">
                        {addr.streetLine1}
                        {addr.streetLine2 ? `, ${addr.streetLine2}` : ''}
                      </p>
                      <p className="text-xs text-slate-600">
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{addr.phone}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Recipient Name *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.recipientName}
                      onChange={(e) =>
                        setNewAddress((p) => ({ ...p, recipientName: e.target.value }))
                      }
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress((p) => ({ ...p, phone: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.streetLine1}
                      onChange={(e) => setNewAddress((p) => ({ ...p, streetLine1: e.target.value }))}
                      placeholder="123 Market St"
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Apt / Suite / Unit (optional)
                    </label>
                    <input
                      type="text"
                      value={newAddress.streetLine2}
                      onChange={(e) => setNewAddress((p) => ({ ...p, streetLine2: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">City *</label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">State *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Postal Code *</label>
                      <input
                        type="text"
                        required
                        value={newAddress.postalCode}
                        onChange={(e) =>
                          setNewAddress((p) => ({ ...p, postalCode: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Payment Method */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
                2
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">Payment Option</h2>
            </div>

            <div className="mt-4 space-y-3">
              {/* Simulated Card */}
              <label
                className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all ${
                  paymentMethod === 'simulated_card'
                    ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="simulated_card"
                  checked={paymentMethod === 'simulated_card'}
                  onChange={() => setPaymentMethod('simulated_card')}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-brand-600" />
                    <span className="text-sm font-bold text-slate-900">
                      Simulated Demo Card (Test Mode)
                    </span>
                    <Badge variant="brand">Instant Confirmation</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Internship simulation — card details are pre-filled and never billed. Order status
                    advances immediately to <strong>confirmed</strong>.
                  </p>
                  <div className="mt-2.5 rounded-lg border border-stone-200 bg-white p-2.5 text-xs font-mono text-slate-600">
                    Demo Card: 4242 •••• •••• 4242 &nbsp;|&nbsp; Exp: 12/28 &nbsp;|&nbsp; CVV: 789
                  </div>
                </div>
              </label>

              {/* Cash on Delivery */}
              <label
                className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={() => setPaymentMethod('cash_on_delivery')}
                  className="mt-1 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Pay in cash when your delivery driver arrives at your doorstep. Order status starts
                    as <strong>pending</strong>.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Delivery Notes */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900">Delivery Instructions (optional)</h3>
            <textarea
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gate code, drop-off spot, or building access notes..."
              className="mt-2 w-full rounded-xl border border-stone-300 p-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Column: Order Review */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Order Items Review</h2>

            {/* Item list */}
            <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 pr-1">
              {cart.items.map((item) => (
                <div key={item.itemId || item.productId} className="flex items-center gap-3 py-2.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {item.primaryImage && (
                      <img
                        src={item.primaryImage}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      Qty: {item.quantity} &times; {formatCurrency(item.price)}
                    </p>
                  </div>
                  <span className="font-display text-xs font-bold text-slate-900">
                    {formatCurrency(item.lineTotal || item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="border-t border-stone-200 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>
                  {cart.shippingFee === 0 ? (
                    <strong className="font-semibold text-emerald-700">FREE</strong>
                  ) : (
                    formatCurrency(cart.shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (8%)</span>
                <span className="font-semibold text-slate-900">{formatCurrency(cart.taxAmount)}</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between text-base">
                <span className="font-bold text-slate-900">Total Due</span>
                <span className="font-display text-xl font-extrabold text-slate-900">
                  {formatCurrency(cart.totalAmount)}
                </span>
              </div>
            </div>

            <Button type="submit" size="lg" loading={placingOrder} className="w-full">
              Place Order &bull; {formatCurrency(cart.totalAmount)}
            </Button>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Stock is locked atomically during order placement
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
