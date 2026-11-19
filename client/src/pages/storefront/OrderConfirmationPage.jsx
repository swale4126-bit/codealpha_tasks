import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Package, ShoppingBag, Truck } from 'lucide-react';
import { getOrderByIdRequest } from '../../services/orderService.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { ErrorState, LoadingSpinner } from '../../components/common/StateBlocks.jsx';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOrderByIdRequest(id)
      .then(setOrder)
      .catch((err) => setError(err.message || 'Could not load order confirmation.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <LoadingSpinner label="Loading order receipt..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ErrorState title="Order not found" message={error} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Confirmation Hero */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-slate-900">
          Order Confirmed!
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Thank you for shopping with KoraMarket. We have received your order and reserved your items.
        </p>
        <p className="mt-3 text-xs font-mono font-bold text-emerald-800">
          Order Number: {order.orderNumber}
        </p>
      </div>

      {/* Summary Card */}
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <p className="text-xs text-slate-500">Order Placed</p>
            <p className="text-sm font-semibold text-slate-900">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Fulfillment Status</p>
            <Badge variant="brand" className="mt-0.5 uppercase tracking-wider">
              {order.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-slate-500">Payment Status</p>
            <Badge
              variant={order.payment?.paymentStatus === 'simulated_paid' ? 'success' : 'warning'}
              className="mt-0.5"
            >
              {order.payment?.paymentStatus === 'simulated_paid' ? 'Paid (Simulated)' : 'Pay on Delivery'}
            </Badge>
          </div>
        </div>

        {/* Shipping Address Snapshot */}
        <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Truck className="h-4 w-4 text-brand-600" />
            Shipping Destination
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {order.shippingAddress.recipientName}
          </p>
          <p className="text-xs text-slate-600">
            {order.shippingAddress.streetLine1}
            {order.shippingAddress.streetLine2 ? `, ${order.shippingAddress.streetLine2}` : ''}
          </p>
          <p className="text-xs text-slate-600">
            {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
            {order.shippingAddress.postalCode}
          </p>
          <p className="mt-1 text-xs text-slate-500">Contact: {order.shippingAddress.phone}</p>
        </div>

        {/* Purchased Items */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Items Ordered</h3>
          <div className="mt-3 divide-y divide-stone-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {item.primaryImage && (
                      <img
                        src={item.primaryImage}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.productName}</p>
                    <p className="text-xs text-slate-500">
                      Qty: {item.quantity} &times; {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                </div>
                <span className="font-display text-sm font-bold text-slate-900">
                  {formatCurrency(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="border-t border-stone-200 pt-4 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping Fee</span>
            <span className="font-semibold">
              {order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Tax</span>
            <span className="font-semibold text-slate-900">{formatCurrency(order.taxAmount)}</span>
          </div>
          <div className="border-t border-stone-100 pt-2 flex justify-between text-base font-bold text-slate-900">
            <span>Total Paid / Due</span>
            <span className="font-display text-lg font-extrabold">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-wrap gap-3">
          <Link to={`/orders/${order.id}`} className="flex-1">
            <Button variant="primary" className="w-full">
              <Package className="h-4 w-4" />
              Track Order Status
            </Button>
          </Link>
          <Link to="/products" className="flex-1">
            <Button variant="outline" className="w-full">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
