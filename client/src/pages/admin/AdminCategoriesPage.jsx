import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Edit2,
  FolderTree,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../../services/categoryService.js';
import useToast from '../../hooks/useToast.js';
import { extractApiError } from '../../utils/formatters.js';
import Button from '../../components/common/Button.jsx';
import { EmptyState, ErrorState, LoadingSpinner } from '../../components/common/StateBlocks.jsx';

const INITIAL_CATEGORY_FORM = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  displayOrder: 0,
};

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(INITIAL_CATEGORY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(extractApiError(err, 'Failed to fetch categories.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      ...INITIAL_CATEGORY_FORM,
      displayOrder: categories.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormData({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      imageUrl: c.imageUrl || '',
      displayOrder: c.displayOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (name) => {
    setFormData((prev) => {
      const next = { ...prev, name };
      if (!editingCategory) {
        next.slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        displayOrder: parseInt(formData.displayOrder, 10) || 0,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success(`Category "${formData.name}" updated successfully.`);
      } else {
        await createCategory(payload);
        toast.success(`Category "${formData.name}" created successfully.`);
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to save category.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      await deleteCategory(deletingCategory.id);
      toast.success(`Category "${deletingCategory.name}" removed.`);
      setDeletingCategory(null);
      loadCategories();
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to delete category.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Store Departments & Categories
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Structure your product catalog into searchable, high-converting departments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadCategories}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <LoadingSpinner label="Loading product categories..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCategories} />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories created yet"
          description="Create your first storefront category to organize products."
          action={
            <Button size="sm" onClick={handleOpenAdd}>
              Add First Category
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-video w-full bg-stone-100 overflow-hidden">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-400">
                    <FolderTree className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-xs backdrop-blur-xs">
                  {c.productCount || 0} products
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-slate-900">{c.name}</h3>
                  <span className="font-mono text-[10px] text-slate-400">/{c.slug}</span>
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {c.description}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-4">
                  <span className="text-[11px] font-medium text-slate-400">
                    Order index: {c.displayOrder}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-stone-100 hover:text-slate-900"
                      title="Edit Category"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(c)}
                      className="cursor-pointer rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                      title="Delete Category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-stone-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Ergonomic Office"
                  className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Slug Identifier *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ergonomic-office"
                  className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Cover Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  className="mt-1 h-9 w-full rounded-xl border border-stone-300 px-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Department focus and shopping recommendations..."
                  className="mt-1 w-full rounded-xl border border-stone-300 p-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-stone-200 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Delete Category &ldquo;{deletingCategory.name}&rdquo;?
              </h3>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              This will remove the category from the navigation.
            </p>
            {deletingCategory.productCount > 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                <strong>Attention:</strong> This category contains{' '}
                <strong>{deletingCategory.productCount} active products</strong>. The backend
                safeguard will prevent deletion until those products are reassigned or removed.
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => setDeletingCategory(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDeleteConfirm}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
