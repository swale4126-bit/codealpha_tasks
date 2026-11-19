import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Check,
  Edit2,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from '../../services/productService.js';
import { getCategories } from '../../services/categoryService.js';
import { updateAdminProductInventory } from '../../services/adminService.js';
import useToast from '../../hooks/useToast.js';
import useDebounce from '../../hooks/useDebounce.js';
import { extractApiError, formatCurrency } from '../../utils/formatters.js';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { EmptyState, ErrorState, LoadingSpinner } from '../../components/common/StateBlocks.jsx';

const INITIAL_FORM = {
  name: '',
  slug: '',
  categoryId: '',
  sku: '',
  price: '',
  compareAtPrice: '',
  stockQuantity: '20',
  lowStockThreshold: '5',
  shortDescription: '',
  description: '',
  primaryImage: '',
  isFeatured: false,
  isActive: true,
};

export default function AdminProductsPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Quick Restock state
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restocking, setRestocking] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts({
        search: debouncedSearch || undefined,
        category: selectedCategory || undefined,
        inStock: stockFilter === 'in_stock' ? 'true' : undefined,
        page,
        limit: 12,
      });
      setProducts(res.products);
      setMeta(res.meta);
    } catch (err) {
      setError(extractApiError(err, 'Failed to load products.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, stockFilter, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      ...INITIAL_FORM,
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      slug: p.slug,
      categoryId: String(p.category.id),
      sku: p.sku,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
      stockQuantity: String(p.stockQuantity),
      lowStockThreshold: String(p.lowStockThreshold),
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      primaryImage: p.primaryImage || '',
      isFeatured: !!p.isFeatured,
      isActive: !!p.isActive,
    });
    setIsFormOpen(true);
  };

  const handleNameChange = (name) => {
    setFormData((prev) => {
      const next = { ...prev, name };
      if (!editingProduct) {
        next.slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return next;
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        categoryId: Number(formData.categoryId),
        sku: formData.sku.trim(),
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        stockQuantity: parseInt(formData.stockQuantity, 10),
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10),
        shortDescription: formData.shortDescription.trim() || null,
        description: formData.description.trim(),
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
      };

      if (formData.primaryImage && formData.primaryImage.trim()) {
        payload.images = [
          {
            imageUrl: formData.primaryImage.trim(),
            altText: formData.name,
            isPrimary: true,
            displayOrder: 1,
          },
        ];
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success(`Product "${formData.name}" updated successfully.`);
      } else {
        await createProduct(payload);
        toast.success(`Product "${formData.name}" published to catalog.`);
      }

      setIsFormOpen(false);
      loadProducts();
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to save product.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      const res = await deleteProduct(deletingProduct.id);
      toast.success(res.message || `Product "${deletingProduct.name}" removed.`);
      setDeletingProduct(null);
      loadProducts();
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to delete product.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProduct) return;
    const qty = parseInt(restockQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid stock quantity (0 or greater).');
      return;
    }
    setRestocking(true);
    try {
      await updateAdminProductInventory(restockProduct.id, { stockQuantity: qty });
      toast.success(`Updated stock for "${restockProduct.name}" to ${qty} units.`);
      setRestockProduct(null);
      loadProducts();
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to update stock.'));
    } finally {
      setRestocking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Product Management
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Publish products, manage SKUs, adjust pricing, and track live stock.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadProducts}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or SKU..."
            className="h-10 w-full rounded-xl border border-stone-200 bg-white pr-4 pl-9 text-xs text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name} ({c.productCount || 0})
            </option>
          ))}
        </select>

        {/* Stock Filter */}
        <select
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Inventory States</option>
          <option value="in_stock">In Stock</option>
        </select>
      </div>

      {/* Products Table */}
      {loading ? (
        <LoadingSpinner label="Loading catalog inventory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products match your criteria"
          description="Try clearing search filters or create a new catalog item."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setStockFilter('all');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Stock</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-slate-700">
                {products.map((p) => {
                  const outOfStock = p.stockQuantity <= 0;
                  const lowStock = !outOfStock && p.stockQuantity <= p.lowStockThreshold;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.primaryImage || '/placeholder.png'}
                            alt={p.name}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover bg-stone-100"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">{p.name}</p>
                            <span className="font-mono text-[11px] text-slate-400">
                              SKU: {p.sku}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800">{p.category.name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-display font-bold text-slate-900">
                          {formatCurrency(p.price)}
                        </span>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="block text-[11px] text-slate-400 line-through">
                            {formatCurrency(p.compareAtPrice)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRestockProduct(p);
                            setRestockQuantity(String(p.stockQuantity));
                          }}
                          className="group inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {outOfStock ? (
                            <Badge variant="danger">0 Out of Stock</Badge>
                          ) : lowStock ? (
                            <Badge variant="warning">{p.stockQuantity} Low Stock</Badge>
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {p.stockQuantity} units
                            </span>
                          )}
                          <Boxes className="h-3 w-3 text-slate-400 group-hover:text-brand-600" />
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {p.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="neutral">Archived</Badge>
                          )}
                          {p.isFeatured && <Badge variant="brand">Featured</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-stone-100 hover:text-slate-900"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(p)}
                            className="cursor-pointer rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Delete or Archive Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-200 px-5 py-4 text-xs">
              <span className="text-slate-500 font-medium">
                Page {meta.page} of {meta.totalPages} ({meta.total} products)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Product Details' : 'Add New Product to Store'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-stone-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Ergonomic Office Chair"
                    className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Slug (URL identifier) *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="ergonomic-office-chair"
                    className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block font-semibold text-slate-700">Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="EOC-2026-BLK"
                    className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="129.99"
                    className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block font-semibold text-slate-700">Compare at Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    placeholder="Optional original price"
                    className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="Units available"
                    className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Low Stock Alert Limit</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, lowStockThreshold: e.target.value })
                    }
                    placeholder="5"
                    className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Primary Image URL</label>
                <input
                  type="url"
                  value={formData.primaryImage}
                  onChange={(e) => setFormData({ ...formData, primaryImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Short Summary</label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="One sentence value proposition for card display"
                  className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Full Description *</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed specifications, features, and materials..."
                  className="mt-1 w-full rounded-xl border border-stone-300 p-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                  />
                  Featured Pick on Homepage
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                  />
                  Active in Customer Catalog
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-stone-200 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingProduct ? 'Save Changes' : 'Publish Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Safeguard Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Confirm Product Removal
              </h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Are you sure you want to remove <strong>&ldquo;{deletingProduct.name}&rdquo;</strong>?
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              <strong>Architectural Safeguard:</strong> If this product was previously ordered by
              customers, the backend will safely archive it (deactivate) to preserve historical
              order integrity. If never ordered, it will be deleted permanently.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => setDeletingProduct(null)}
              >
                Keep Product
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDeleteConfirm}
              >
                Proceed with Safeguarded Removal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-slate-900">
              Update Stock Quantity
            </h3>
            <p className="mt-1 text-xs text-slate-500">{restockProduct.name}</p>
            <form onSubmit={handleQuickRestockSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  New Units Count
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setRestockProduct(null)}
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit" loading={restocking}>
                  Save Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
