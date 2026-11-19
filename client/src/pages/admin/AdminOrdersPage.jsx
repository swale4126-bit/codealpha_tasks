import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MapPin,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { getAdminOrders, updateAdminOrderStatus } from '../../services/adminService.js';
import useToast from '../../hooks/useToast.js';
import useDebounce from '../../hooks/useDebounce.js';
import { extractApiError, formatCurrency, formatDate } from '../../utils/formatters.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { EmptyState, ErrorState, LoadingSpinner } from '../../components/common/StateBlocks.jsx';

const STATUS_OPTIONS = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const currentStatus = searchParams.get('status') || 'all';
  const initialSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOrders({
        status: currentStatus !== 'all' ? currentStatus : undefined,
        search: debouncedSearch || undefined,
        page: currentPage,
        limit: 12,
      });
      setOrders(res.orders);
      setMeta(res.meta);
    } catch (err) {
      setError(extractApiError(err, 'Failed to fetch customer orders.'));
    } finally {
      setLoading(false);
    }
  }, [currentStatus, debouncedSearch, currentPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusTab = (status) => {
    const next = new URLSearchParams(searchParams);
    if (status === 'all') {
      next.delete('status');
    } else {
      next.set('status', status);
    }
    next.delete('page');
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
  };

  const handleStatusChange = async (orderId, nextStatus) => {
    setUpdatingId(orderId);
    try {
      await updateAdminOrderStatus(orderId, nextStatus);
      toast.success(`Order #${orderId} status set to "${nextStatus}".`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to change order status.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'shipped':
        return <Badge variant="brand">Shipped</Badge>;
      case 'processing':
        return <Badge variant="info">Processing</Badge>;
      case 'confirmed':
        return <Badge variant="neutral">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Order Fulfillment
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Monitor, inspect, and advance shipping states across all transactions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadOrders}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-stone-200 bg-white p-1 shadow-xs">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusTab(status)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                currentStatus === status
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search order #, customer, email..."
            className="h-10 w-full rounded-xl border border-stone-200 bg-white pr-4 pl-9 text-xs text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <LoadingSpinner label="Loading customer orders..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadOrders} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={
            searchInput || currentStatus !== 'all'
              ? 'Try resetting your search query or picking a different status filter.'
              : 'Orders placed by customers will appear here.'
          }
          action={
            (searchInput || currentStatus !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput('');
                  handleStatusTab('all');
                }}
              >
                Reset Filters
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-slate-700">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{ord.customer.fullName}</p>
                      <p className="text-[11px] text-slate-400">{ord.customer.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(ord.createdAt)}</td>
                    <td className="px-5 py-4 font-medium">{ord.itemCount} item(s)</td>
                    <td className="px-5 py-4 font-display font-bold text-slate-900">
                      {formatCurrency(ord.totalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold uppercase text-slate-800">
                        {ord.paymentMethod}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={ord.status}
                        disabled={updatingId === ord.id || ord.status === 'cancelled'}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                          ord.status === 'delivered'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : ord.status === 'cancelled'
                            ? 'border-rose-200 bg-rose-50 text-rose-800 cursor-not-allowed opacity-75'
                            : 'border-stone-200 bg-white text-slate-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedOrder(ord)}
                        className="text-slate-600 hover:text-brand-600"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 px-5 py-4 text-xs">
              <span className="text-slate-500 font-medium">
                Page {meta.page} of {meta.totalPages} ({meta.total} orders total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page <= 1}
                  onClick={() => handlePageChange(meta.page - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => handlePageChange(meta.page + 1)}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inspect Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">Order Inspection</span>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-stone-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs text-slate-700">
              {/* Customer & Shipping Details */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  Shipping Destination
                </div>
                <p className="font-semibold text-slate-900">
                  {selectedOrder.shippingAddressSnapshot?.fullName || selectedOrder.customer.fullName}
                </p>
                <p className="text-slate-600">
                  {selectedOrder.shippingAddressSnapshot?.addressLine1}{' '}
                  {selectedOrder.shippingAddressSnapshot?.addressLine2}
                </p>
                <p className="text-slate-600">
                  {selectedOrder.shippingAddressSnapshot?.city},{' '}
                  {selectedOrder.shippingAddressSnapshot?.state}{' '}
                  {selectedOrder.shippingAddressSnapshot?.postalCode},{' '}
                  {selectedOrder.shippingAddressSnapshot?.country}
                </p>
                <p className="text-slate-500 font-mono">
                  Phone: {selectedOrder.shippingAddressSnapshot?.phone || selectedOrder.customer.phone || 'N/A'}
                </p>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2 border-t border-stone-200 pt-3">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Shipping Fee</span>
                  <span>
                    {selectedOrder.shippingFee === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Tax (8%)</span>
                  <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-2 font-display text-sm font-bold text-slate-900">
                  <span>Total Amount</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <span className="font-semibold text-amber-900">Customer Notes:</span>
                  <p className="mt-1 text-slate-700">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
