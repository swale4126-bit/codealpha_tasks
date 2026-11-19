import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package, ShoppingBag } from 'lucide-react';
import { getMyOrdersRequest } from '../../services/orderService.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { EmptyState, LoadingSpinner } from '../../components/common/StateBlocks.jsx';

const STATUS_VARIANTS = {
  pending: 'warning',
  confirmed: 'brand',
  processing: 'brand',
  shipped: 'brand',
  delivered: 'success',
  cancelled: 'danger',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyOrdersRequest({ status: statusFilter || undefined, limit: 10 });
      setOrders(data.orders);
      setMeta(data.meta);
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">Your Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track fulfillment, view delivery status, or inspect past purchases.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="order-status-filter" className="text-xs font-semibold text-slate-600">
            Filter status:
          </label>
          <select
            id="order-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <LoadingSpinner label="Loading your order history..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders found"
            description={
              statusFilter
                ? `You have no orders matching status "${statusFilter}".`
                : 'You have not placed any orders yet. Discover essentials for work, audio, and living.'
            }
            action={
              <Link
                to="/products"
                className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Start Shopping
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const variant = STATUS_VARIANTS[order.status] || 'neutral';
              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs transition-all hover:border-stone-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {order.orderNumber}
                      </span>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Badge variant={variant} className="uppercase tracking-wider">
                        {order.status}
                      </Badge>
                      <Badge
                        variant={order.payment?.paymentStatus === 'simulated_paid' ? 'success' : 'neutral'}
                      >
                        {order.payment?.paymentStatus === 'simulated_paid' ? 'Paid' : 'Unpaid (COD)'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-slate-600">
                      <span>Recipient: <strong>{order.shippingAddress.recipientName}</strong></span>
                      <span className="mx-2">&bull;</span>
                      <span>Destination: <strong>{order.shippingAddress.city}, {order.shippingAddress.state}</strong></span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-500">Total</span>
                        <p className="font-display text-base font-bold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>

                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          Details & Tracking
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
