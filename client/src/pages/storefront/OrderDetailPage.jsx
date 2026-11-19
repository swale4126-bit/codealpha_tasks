import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { cancelOrderRequest, getOrderByIdRequest } from '../../services/orderService.js';
import useToast from '../../hooks/useToast.js';
import { extractApiError, formatCurrency, formatDate } from '../../utils/formatters.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { ErrorState, LoadingSpinner } from '../../components/common/StateBlocks.jsx';

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Check },
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderByIdRequest(id);
      setOrder(data);
    } catch (err) {
      setError(extractApiError(err, 'Order details not found.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const updated = await cancelOrderRequest(id);
      setOrder(updated);
      setShowCancelConfirm(false);
      toast.success('Your order has been cancelled and inventory was restored.');
    } catch (err) {
      toast.error(extractApiError(err, 'Could not cancel order.'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20">
        <LoadingSpinner label="Loading order details..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ErrorState title="Order not found" message={error} onRetry={fetchOrder} />
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currentStepIdx = TIMELINE_STEPS.findIndex((s) => s.key === order.status);
  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back button & Title */}
      <div className="flex flex-col gap-3 border-b border-stone-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold text-slate-900">
              Order {order.orderNumber}
            </h1>
            <Badge
              variant={isCancelled ? 'danger' : order.status === 'delivered' ? 'success' : 'brand'}
              className="uppercase tracking-wider"
            >
              {order.status}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Placed on {formatDate(order.createdAt)} &bull; {order.items.length} unique line item(s)
          </p>
        </div>

        {canCancel && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelConfirm(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Cancel Order
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Prompt */}
      {showCancelConfirm && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/70 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">Cancel this order?</h3>
              <p className="mt-1 text-xs text-slate-600">
                Are you sure you want to cancel order <strong>{order.orderNumber}</strong>? Your
                reserved inventory will be restored immediately, and any simulated payment will be marked refunded.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancelling}
                  onClick={handleCancelOrder}
                >
                  Yes, Cancel Order
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelling}
                  onClick={() => setShowCancelConfirm(false)}
                >
                  Keep Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Tracking Timeline */}
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Order Status Tracker
        </h2>

        {isCancelled ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-800">
            <XCircle className="h-6 w-6 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-bold">This order was cancelled</p>
              <p className="text-xs text-red-700">
                Items were returned to available inventory and any associated payments were marked refunded.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {TIMELINE_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPastOrCurrent = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                      isCurrent
                        ? 'bg-brand-500 text-white shadow-md ring-4 ring-brand-500/20'
                        : isPastOrCurrent
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`mt-2.5 text-xs font-bold ${
                      isCurrent
                        ? 'text-brand-600'
                        : isPastOrCurrent
                          ? 'text-slate-900'
                          : 'text-stone-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Split Details Section */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Items breakdown */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <h2 className="font-display text-base font-bold text-slate-900">Line Items Snapshot</h2>
            <div className="mt-4 divide-y divide-stone-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3.5">
                  <div className="flex items-center gap-3.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                      {item.primaryImage && (
                        <img
                          src={item.primaryImage}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{item.productName}</h3>
                      <p className="text-xs text-slate-400">SKU: {item.sku}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.quantity} &times; {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <span className="font-display text-sm font-bold text-slate-900">
                    {formatCurrency(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financials */}
            <div className="mt-6 border-t border-stone-200 pt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold">
                  {order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span className="font-semibold text-slate-900">{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="border-t border-stone-100 pt-2 flex justify-between text-base font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="font-display text-lg font-extrabold text-slate-900">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Shipping + Payment Cards */}
        <div className="space-y-6 lg:col-span-4">
          {/* Shipping Snapshot Card */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Truck className="h-4 w-4 text-brand-600" />
              Delivery Destination
            </div>
            <p className="mt-3 text-sm font-bold text-slate-900">
              {order.shippingAddress.recipientName}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {order.shippingAddress.streetLine1}
              {order.shippingAddress.streetLine2 ? `, ${order.shippingAddress.streetLine2}` : ''}
            </p>
            <p className="text-xs text-slate-600">
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}
            </p>
            <p className="text-xs text-slate-500">{order.shippingAddress.country}</p>
            <p className="mt-2 text-xs text-slate-500">Phone: {order.shippingAddress.phone}</p>
            {order.notes && (
              <div className="mt-3 rounded-lg bg-stone-50 p-2 text-xs text-slate-600 italic">
                &ldquo;{order.notes}&rdquo;
              </div>
            )}
          </div>

          {/* Payment Snapshot Card */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Payment Information
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Method:</span>
                <strong className="text-slate-900">
                  {order.payment?.paymentMethod === 'simulated_card'
                    ? 'Simulated Demo Card'
                    : 'Cash on Delivery'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge
                  variant={
                    order.payment?.paymentStatus === 'simulated_paid'
                      ? 'success'
                      : order.payment?.paymentStatus === 'refunded'
                        ? 'neutral'
                        : 'warning'
                  }
                >
                  {order.payment?.paymentStatus}
                </Badge>
              </div>
              {order.payment?.transactionRef && (
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-mono text-slate-500">{order.payment.transactionRef}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
