import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import {
  getAdminDashboard,
  getAdminSalesSummary,
  updateAdminProductInventory,
} from '../../services/adminService.js';
import useToast from '../../hooks/useToast.js';
import { extractApiError, formatCurrency, formatDate } from '../../utils/formatters.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { ErrorState, LoadingSpinner } from '../../components/common/StateBlocks.jsx';

export default function AdminDashboardPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [salesSummary, setSalesSummary] = useState(null);
  const [restockingId, setRestockingId] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, salesData] = await Promise.all([
        getAdminDashboard(),
        getAdminSalesSummary(30),
      ]);
      setDashboard(dashData);
      setSalesSummary(salesData);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load admin dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleQuickRestock = async (product) => {
    setRestockingId(product.id);
    try {
      const newStock = product.stockQuantity + 20;
      await updateAdminProductInventory(product.id, { stockQuantity: newStock });
      toast.success(`Restocked "${product.name}" to ${newStock} units.`);
      loadDashboard();
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to restock product.'));
    } finally {
      setRestockingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Compiling live store analytics..." />;
  }

  if (error || !dashboard) {
    return <ErrorState message={error} onRetry={loadDashboard} />;
  }

  const { kpis, ordersByStatus, recentOrders, lowStockItems } = dashboard;

  const statusIcons = {
    pending: Clock,
    confirmed: CheckCircle2,
    processing: Package,
    shipped: Truck,
    delivered: CheckCircle2,
    cancelled: AlertTriangle,
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Storefront Overview
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time telemetry, transaction metrics, and inventory monitoring.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboard}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Metrics
        </Button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gross Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-black text-slate-900">
            {formatCurrency(kpis.grossRevenue)}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            Settled orders
          </p>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Orders
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-black text-slate-900">{kpis.totalOrders}</p>
          <Link
            to="/admin/orders"
            className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
          >
            Manage all orders &rarr;
          </Link>
        </div>

        {/* Active Customers */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Customers
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-black text-slate-900">
            {kpis.activeCustomers}
          </p>
          <Link
            to="/admin/customers"
            className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:underline"
          >
            View customer base &rarr;
          </Link>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Low-Stock Alerts
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-black text-slate-900">
            {kpis.lowStockProducts}
          </p>
          <p className="mt-1 text-[11px] font-medium text-amber-600">
            {kpis.lowStockProducts > 0 ? 'Requires replenishment' : 'All items well-stocked'}
          </p>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Order Status Pipeline
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(ordersByStatus).map(([status, count]) => {
            const Icon = statusIcons[status] || Package;
            return (
              <Link
                key={status}
                to={`/admin/orders?status=${status}`}
                className="flex flex-col items-center justify-center rounded-xl border border-stone-200/80 bg-stone-50 p-3 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <Icon className="h-4 w-4 text-slate-500" />
                <span className="mt-1.5 text-xs font-medium capitalize text-slate-600">
                  {status}
                </span>
                <span className="mt-0.5 font-display text-lg font-bold text-slate-900">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sales Summary & Top Categories */}
      {salesSummary && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Revenue by Category */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs lg:col-span-7">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Revenue by Department</h2>
              <span className="text-xs font-medium text-slate-400">Past 30 Days</span>
            </div>
            <div className="mt-6 space-y-4">
              {salesSummary.categoryRevenue.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No settled sales recorded yet.
                </p>
              ) : (
                salesSummary.categoryRevenue.map((cat) => {
                  const maxRev = Math.max(
                    ...salesSummary.categoryRevenue.map((c) => c.revenue),
                    1
                  );
                  const percent = Math.round((cat.revenue / maxRev) * 100);
                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{cat.name}</span>
                        <span className="font-display font-bold text-slate-900">
                          {formatCurrency(cat.revenue)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs lg:col-span-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Top Performing Items</h2>
              <Link
                to="/admin/products"
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                All Products
              </Link>
            </div>
            <div className="mt-4 divide-y divide-stone-100">
              {salesSummary.topProducts.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No product sales recorded yet.
                </p>
              ) : (
                salesSummary.topProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0 pr-3">
                      <p className="truncate text-xs font-semibold text-slate-800">{p.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {p.unitsSold} units sold &bull; {p.categoryName}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-xs font-bold text-slate-900">
                      {formatCurrency(p.totalRevenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Split Rows: Recent Orders & Low Stock Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recent Orders */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between border-b border-stone-200 p-5">
            <h2 className="text-sm font-bold text-slate-900">Recent Customer Orders</h2>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-stone-100 overflow-x-auto">
            {recentOrders.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">No orders placed yet.</p>
            ) : (
              recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-stone-50/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {ord.orderNumber}
                      </span>
                      <Badge
                        variant={
                          ord.status === 'delivered'
                            ? 'success'
                            : ord.status === 'cancelled'
                            ? 'danger'
                            : 'brand'
                        }
                      >
                        {ord.status}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {ord.customer.fullName} &bull; {ord.itemCount} item(s) &bull;{' '}
                      {formatDate(ord.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xs font-bold text-slate-900">
                      {formatCurrency(ord.totalAmount)}
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {ord.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Replenishment Table */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between border-b border-stone-200 p-5">
            <h2 className="text-sm font-bold text-slate-900">Low-Stock Attention</h2>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              Threshold alert
            </span>
          </div>
          <div className="divide-y divide-stone-100">
            {lowStockItems.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">
                All catalog inventory is above threshold.
              </p>
            ) : (
              lowStockItems.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-stone-50/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.primaryImage || '/placeholder.png'}
                      alt={prod.name}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover bg-stone-100"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">{prod.name}</p>
                      <p className="text-[11px] font-medium text-amber-600">
                        {prod.stockQuantity} remaining (limit {prod.lowStockThreshold})
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={restockingId === prod.id}
                    onClick={() => handleQuickRestock(prod)}
                  >
                    +20 Stock
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
