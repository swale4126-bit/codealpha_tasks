import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
} from 'lucide-react';
import { getAdminCustomers, updateAdminCustomerStatus } from '../../services/adminService.js';
import useToast from '../../hooks/useToast.js';
import useDebounce from '../../hooks/useDebounce.js';
import { extractApiError, formatCurrency, formatDate } from '../../utils/formatters.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { EmptyState, ErrorState, LoadingSpinner } from '../../components/common/StateBlocks.jsx';

export default function AdminCustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCustomers({
        search: debouncedSearch || undefined,
        page,
        limit: 12,
      });
      setCustomers(res.customers);
      setMeta(res.meta);
    } catch (err) {
      setError(extractApiError(err, 'Failed to fetch customer list.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleToggleStatus = async (customer) => {
    const nextStatus = !customer.isActive;
    setTogglingId(customer.id);
    try {
      await updateAdminCustomerStatus(customer.id, nextStatus);
      toast.success(
        `Customer "${customer.fullName}" account ${nextStatus ? 'activated' : 'suspended'}.`
      );
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, isActive: nextStatus } : c))
      );
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to update customer status.'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Customer Directory
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            View registered customer profiles, track lifetime spending, and manage access.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadCustomers}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder="Search customer by name, email, phone..."
          className="h-10 w-full rounded-xl border border-stone-200 bg-white pr-4 pl-9 text-xs text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {/* Customers Table */}
      {loading ? (
        <LoadingSpinner label="Loading customer accounts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCustomers} />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customer accounts found"
          description="Registered shoppers will be cataloged here once they create accounts."
          action={
            searchTerm && (
              <Button size="sm" variant="outline" onClick={() => setSearchTerm('')}>
                Clear Search
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
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Total Orders</th>
                  <th className="px-5 py-3.5">Lifetime Spend</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-slate-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                          {c.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{c.fullName}</p>
                          <span className="font-mono text-[11px] text-slate-400">ID #{c.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {c.email}
                      </p>
                      {c.phone && (
                        <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {c.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium">{c.totalOrders} order(s)</td>
                    <td className="px-5 py-3.5 font-display font-bold text-slate-900">
                      {formatCurrency(c.lifetimeSpend)}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Suspended</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant={c.isActive ? 'outline' : 'primary'}
                        loading={togglingId === c.id}
                        onClick={() => handleToggleStatus(c)}
                        className={
                          c.isActive
                            ? 'text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }
                      >
                        {c.isActive ? (
                          <>
                            <UserX className="h-3.5 w-3.5" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            Reactivate
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 px-5 py-4 text-xs">
              <span className="text-slate-500 font-medium">
                Page {meta.page} of {meta.totalPages} ({meta.total} customers total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
