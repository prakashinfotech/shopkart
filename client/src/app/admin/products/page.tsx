'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Pencil, Trash2, Package,
  Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Star, X,
  Eye, EyeOff,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Product = any;

interface Meta { total: number; page: number; pages: number; }

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

type Toast = { id: number; type: 'success' | 'error'; message: string };

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

export default function AdminProductsPage() {
  const { toasts, push } = useToast();

  const [products,    setProducts]    = useState<Product[]>([]);
  const [meta,        setMeta]        = useState<Meta>({ total: 0, page: 1, pages: 1 });
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [confirmId,   setConfirmId]   = useState<string | null>(null);
  const [togglingId,  setTogglingId]  = useState<string | null>(null);

  const fetchProducts = useCallback(async (q: string, page: number) => {
    setLoading(true);
    try {
      const token  = localStorage.getItem('token');
      const params = new URLSearchParams({ q, page: String(page), limit: '15' });
      const res    = await fetch(`/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProducts(data.products ?? []);
      setMeta({ total: data.total ?? 0, page: data.page ?? 1, pages: data.pages ?? 1 });
    } catch {
      push('error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { fetchProducts(search, 1); }, [search, fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  // ── Toggle listing status ────────────────────────────────────────────────

  async function handleToggleListing(id: string, currentlyListed: boolean) {
    setTogglingId(id);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/admin/products/${id}/listing`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Optimistic local update — no full reload needed
      setProducts(p =>
        p.map(x => x._id === id ? { ...x, isListed: data.isListed } : x)
      );
      push('success', currentlyListed ? 'Product de-listed' : 'Product listed');
    } catch (err: unknown) {
      push('error', err instanceof Error ? err.message : 'Failed to update listing');
    } finally {
      setTogglingId(null);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/admin/products/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(p => p.filter(x => x._id !== id));
      setMeta(m => ({ ...m, total: m.total - 1 }));
      push('success', 'Product deleted');
    } catch (err: unknown) {
      push('error', err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  const listed   = products.filter((p: Product) => p.isListed !== false).length;
  const delisted = products.filter((p: Product) => p.isListed === false).length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Toast notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg
                        shadow-xl text-white text-sm font-medium animate-fade-in
                        ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {t.type === 'success'
              ? <CheckCircle2 size={15} className="flex-shrink-0" />
              : <XCircle      size={15} className="flex-shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-gray-500">{meta.total} total</p>
            {!loading && (
              <>
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <Eye size={12} /> {listed} listed
                </span>
                {delisted > 0 && (
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                    <EyeOff size={12} /> {delisted} de-listed
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold
                     px-4 py-2 rounded-lg hover:brightness-110 transition-all shadow-sm"
        >
          <Plus size={15} />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or brand…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg
                       outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {searchInput && (
            <button type="button"
              onClick={() => { setSearchInput(''); setSearch(''); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X size={13} />
            </button>
          )}
        </div>
        <button type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg
                     hover:bg-gray-700 transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={30} className="animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package size={56} className="text-gray-200" />
            <p className="text-gray-500 text-sm">No products found</p>
            {search && (
              <button onClick={() => { setSearch(''); setSearchInput(''); }}
                className="text-primary text-sm font-medium hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 w-10">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Product</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Price</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Stock</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Featured</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {products.map((p: Product, idx: number) => {
                  const isListed = p.isListed !== false; // default true for older docs

                  return (
                    <tr
                      key={p._id}
                      className={`transition-colors
                        ${isListed
                          ? 'hover:bg-gray-50'
                          : 'bg-gray-50/70 hover:bg-gray-100/60'}`}
                    >
                      {/* Row # */}
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {(meta.page - 1) * 15 + idx + 1}
                      </td>

                      {/* Product + thumbnail */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden
                                          ${isListed ? 'bg-gray-100' : 'bg-gray-200'}`}>
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt={p.name}
                                className={`w-full h-full object-contain p-1
                                            ${isListed ? '' : 'opacity-50'}`} />
                            ) : (
                              <Package size={16} className="text-gray-300 m-auto mt-3" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium truncate max-w-[180px]
                                          ${isListed ? 'text-gray-800' : 'text-gray-400'}`}>
                              {p.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {p.brand && (
                                <span className="text-xs text-gray-400">{p.brand}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className={`px-4 py-3 ${isListed ? 'text-gray-600' : 'text-gray-400'}`}>
                        {p.category?.name ?? <span className="text-gray-300">—</span>}
                      </td>

                      {/* Price */}
                      <td className={`px-4 py-3 font-semibold
                                     ${isListed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {fmt(p.price)}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                                          text-xs font-medium
                                          ${!isListed
                                            ? 'bg-gray-100 text-gray-400'
                                            : p.stock > 10
                                              ? 'bg-green-100 text-green-700'
                                              : p.stock > 0
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'}`}>
                          {p.stock > 0 ? p.stock : 'Out'}
                        </span>
                      </td>

                      {/* Featured */}
                      <td className="px-4 py-3 text-center">
                        {p.isFeatured && isListed
                          ? <Star size={15} className="text-yellow-500 fill-yellow-400 inline" />
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3 text-center">
                        {isListed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                           text-[11px] font-semibold bg-green-100 text-green-700">
                            <Eye size={10} />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                           text-[11px] font-semibold bg-gray-200 text-gray-500">
                            <EyeOff size={10} />
                            De-listed
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {confirmId === p._id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-gray-600 whitespace-nowrap">Delete?</span>
                            <button
                              onClick={() => handleDelete(p._id)}
                              disabled={!!deletingId}
                              className="text-xs font-semibold text-red-600 hover:text-red-800
                                         disabled:opacity-50"
                            >
                              {deletingId === p._id
                                ? <Loader2 size={12} className="animate-spin" />
                                : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-end">
                            {/* Edit */}
                            <Link
                              href={`/admin/products/${p._id}/edit`}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50
                                         transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </Link>

                            {/* De-list / Re-list toggle */}
                            <button
                              onClick={() => handleToggleListing(p._id, isListed)}
                              disabled={togglingId === p._id}
                              title={isListed ? 'De-list (hide from users)' : 'Re-list (make visible)'}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50
                                         ${isListed
                                           ? 'text-amber-500 hover:bg-amber-50'
                                           : 'text-green-600 hover:bg-green-50'}`}
                            >
                              {togglingId === p._id
                                ? <Loader2 size={14} className="animate-spin" />
                                : isListed
                                  ? <EyeOff size={14} />
                                  : <Eye    size={14} />}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setConfirmId(p._id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50
                                         transition-colors"
                              title="Delete permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && meta.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100
                          bg-gray-50 text-sm">
            <span className="text-gray-500">Page {meta.page} of {meta.pages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchProducts(search, meta.page - 1)}
                disabled={meta.page === 1}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40
                           hover:bg-white transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => fetchProducts(search, meta.page + 1)}
                disabled={meta.page === meta.pages}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40
                           hover:bg-white transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
