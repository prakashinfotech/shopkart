'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, ShoppingCart, X, SearchX, ShieldCheck,
} from 'lucide-react';
import Navbar      from '@/components/layout/Navbar';
import Footer      from '@/components/layout/Footer';
import CategoryBar from '@/components/home/CategoryBar';
import { useCart } from '@/context/CartContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface APIProduct {
  _id: string;
  name: string;
  price: number;
  mrp: number;
  images: string[];
  brand?: string;
  ratings: number;
  numReviews: number;
  stock: number;
  isFeatured?: boolean;
  category?: { name: string; slug: string };
}

interface Filters {
  sort:       string;
  brands:     string[];
  minPrice:   string;
  maxPrice:   string;
  rating:     string;
  discount:   string;
  inStock:    boolean;
}

const DEFAULT_FILTERS: Filters = {
  sort: 'relevance', brands: [], minPrice: '', maxPrice: '',
  rating: '', discount: '', inStock: false,
};

const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Relevance'          },
  { value: 'price_asc',  label: 'Price — Low to High' },
  { value: 'price_desc', label: 'Price — High to Low' },
  { value: 'rating',     label: 'Customer Rating'     },
  { value: 'newest',     label: 'Newest First'        },
];

const RATINGS  = [{ value: '4', label: '4★ & above' }, { value: '3', label: '3★ & above' }, { value: '2', label: '2★ & above' }];
const DISCOUNTS = ['10', '20', '30', '40', '50'];

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}
function formatReviews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}
function slugToTitle(s: string) {
  return s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// ── Mini product card ──────────────────────────────────────────────────────────

function ProductCard({ product }: { product: APIProduct }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { addToCart } = (useCart() as any) ?? {};
  const [imgErr, setImgErr] = useState(false);
  const pct = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const img = product.images?.[0] || '';

  return (
    <Link
      href={`/product/${product._id}`}
      className="bg-white group flex flex-col border border-transparent
                 hover:border-gray-200 hover:shadow-card-hover rounded-sm
                 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {img && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name}
            className="w-full h-full object-contain p-4
                       group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <ShoppingCart size={44} />
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5
                          bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
            <ShieldCheck size={8} />
            Assured
          </div>
        )}
        {pct >= 10 && (
          <div className="absolute top-2 right-2 bg-green-600 text-white
                          text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
            {pct}% off
          </div>
        )}
        {/* Quick add */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart?.({ ...product, id: product._id, image: img }); }}
          className="absolute bottom-0 inset-x-0 bg-primary text-white text-xs font-semibold
                     py-2 flex items-center justify-center gap-1.5
                     translate-y-full group-hover:translate-y-0 transition-transform duration-200"
        >
          <ShoppingCart size={13} />
          Add to Cart
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {product.brand && <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{product.brand}</p>}
        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug flex-1">{product.name}</p>

        {/* Rating */}
        {product.ratings > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-0.5 bg-green-600 text-white
                             text-xs font-semibold px-1.5 py-0.5 rounded">
              {product.ratings.toFixed(1)}&nbsp;<Star size={9} fill="white" className="flex-shrink-0" />
            </span>
            <span className="text-xs text-gray-400">({formatReviews(product.numReviews)})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1 flex-wrap">
          <span className="text-base font-bold text-gray-900">₹{fmt(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-gray-400 line-through">₹{fmt(product.mrp)}</span>
          )}
        </div>

        {/* Stock */}
        {product.stock === 0 && (
          <p className="text-xs font-semibold text-red-500">Out of Stock</p>
        )}
        {product.stock > 0 && (
          <p className="text-xs text-primary font-medium">Free Delivery</p>
        )}
      </div>
    </Link>
  );
}

// ── Filter section (collapsible) ──────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full text-sm font-bold
                   text-gray-800 mb-2 hover:text-primary transition-colors"
      >
        {title}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children}
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────────────────

function CategoryPageInner() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const slug         = params?.slug as string;

  const [products,  setProducts]  = useState<APIProduct[]>([]);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [brands,    setBrands]    = useState<string[]>([]);
  const [catName,   setCatName]   = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOpen,  setSortOpen]  = useState(false);
  const [priceMin,  setPriceMin]  = useState('');
  const [priceMax,  setPriceMax]  = useState('');

  // Read filters from URL
  const [filters, setFilters] = useState<Filters>(() => ({
    sort:     searchParams?.get('sort')    || 'relevance',
    brands:   searchParams?.get('brand')   ? searchParams!.get('brand')!.split(',') : [],
    minPrice: searchParams?.get('minPrice') || '',
    maxPrice: searchParams?.get('maxPrice') || '',
    rating:   searchParams?.get('rating')  || '',
    discount: searchParams?.get('discount') || '',
    inStock:  searchParams?.get('inStock') === 'true',
  }));

  // Sync price inputs with filters on mount
  useEffect(() => {
    setPriceMin(filters.minPrice);
    setPriceMax(filters.maxPrice);
  }, []); // eslint-disable-line

  // Push filter changes to URL
  const updateURL = useCallback((f: Filters, pg: number) => {
    const p = new URLSearchParams();
    if (f.sort !== 'relevance')    p.set('sort',     f.sort);
    if (f.brands.length)           p.set('brand',    f.brands.join(','));
    if (f.minPrice)                p.set('minPrice', f.minPrice);
    if (f.maxPrice)                p.set('maxPrice', f.maxPrice);
    if (f.rating)                  p.set('rating',   f.rating);
    if (f.discount)                p.set('discount', f.discount);
    if (f.inStock)                 p.set('inStock',  'true');
    if (pg > 1)                    p.set('page',     String(pg));
    router.replace(`/category/${slug}?${p.toString()}`, { scroll: false });
  }, [router, slug]);

  const fetchProducts = useCallback(async (f: Filters, pg: number) => {
    setLoading(true);
    setError('');
    try {
      const p = new URLSearchParams({
        page:  String(pg),
        limit: '20',
        sort:  f.sort,
      });
      if (f.brands.length)  p.set('brand',    f.brands.join(','));
      if (f.minPrice)       p.set('minPrice', f.minPrice);
      if (f.maxPrice)       p.set('maxPrice', f.maxPrice);
      if (f.rating)         p.set('rating',   f.rating);
      if (f.discount)       p.set('discount', f.discount);
      if (f.inStock)        p.set('inStock',  'true');

      const res  = await fetch(`/api/products/category/${slug}?${p}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load products');

      setProducts(data.products ?? []);
      setTotal(data.total     ?? 0);
      setPages(data.pages     ?? 0);
      setBrands(data.brands   ?? []);
      if (data.category?.name) setCatName(data.category.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Initial fetch
  useEffect(() => { fetchProducts(filters, page); }, []); // eslint-disable-line

  // Re-fetch when filters or page changes
  const applyFilters = useCallback((newFilters: Filters, pg = 1) => {
    setFilters(newFilters);
    setPage(pg);
    updateURL(newFilters, pg);
    fetchProducts(newFilters, pg);
    setMobileFiltersOpen(false);
  }, [updateURL, fetchProducts]);

  function toggleBrand(b: string) {
    const next = filters.brands.includes(b)
      ? filters.brands.filter(x => x !== b)
      : [...filters.brands, b];
    applyFilters({ ...filters, brands: next });
  }

  function applyPrice() {
    applyFilters({ ...filters, minPrice: priceMin, maxPrice: priceMax });
  }

  function clearAllFilters() {
    setPriceMin('');
    setPriceMax('');
    applyFilters(DEFAULT_FILTERS);
  }

  const hasActiveFilters =
    filters.brands.length > 0 || filters.minPrice || filters.maxPrice ||
    filters.rating || filters.discount || filters.inStock;

  const displayName = catName || slugToTitle(slug || '');

  // ── Sidebar ────────────────────────────────────────────────────────────────

  const Sidebar = () => (
    <aside className="w-full space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={15} />
          Filters
        </span>
        {hasActiveFilters && (
          <button onClick={clearAllFilters}
            className="text-xs text-primary font-semibold hover:underline">
            Clear All
          </button>
        )}
      </div>

      {/* Price Range */}
      <FilterSection title="PRICE RANGE">
        <div className="flex gap-2">
          <input type="number" min="0" placeholder="Min"
            value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs
                       outline-none focus:border-primary" />
          <input type="number" min="0" placeholder="Max"
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs
                       outline-none focus:border-primary" />
        </div>
        <button onClick={applyPrice}
          className="mt-2 w-full bg-primary text-white text-xs font-semibold
                     py-1.5 rounded hover:brightness-110 transition-all">
          Apply
        </button>
        {(filters.minPrice || filters.maxPrice) && (
          <p className="text-[10px] text-primary mt-1">
            ₹{filters.minPrice || '0'} – ₹{filters.maxPrice || '∞'}
          </p>
        )}
      </FilterSection>

      {/* Brand */}
      {brands.length > 0 && (
        <FilterSection title="BRAND">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {brands.map(b => (
              <label key={b} className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox"
                  checked={filters.brands.includes(b)}
                  onChange={() => toggleBrand(b)}
                  className="accent-primary w-3.5 h-3.5" />
                <span className="text-xs text-gray-700 group-hover:text-primary transition-colors">
                  {b}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      <FilterSection title="CUSTOMER RATINGS">
        <div className="space-y-2">
          {RATINGS.map(r => (
            <label key={r.value} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="rating"
                checked={filters.rating === r.value}
                onChange={() => applyFilters({ ...filters, rating: r.value })}
                className="accent-primary w-3.5 h-3.5" />
              <span className="flex items-center gap-1 text-xs text-gray-700
                               group-hover:text-primary transition-colors">
                <Star size={11} className="text-yellow-500 fill-yellow-400" />
                {r.label}
              </span>
            </label>
          ))}
          {filters.rating && (
            <button onClick={() => applyFilters({ ...filters, rating: '' })}
              className="text-[10px] text-primary hover:underline">
              Clear rating
            </button>
          )}
        </div>
      </FilterSection>

      {/* Discount */}
      <FilterSection title="DISCOUNT">
        <div className="space-y-2">
          {DISCOUNTS.map(d => (
            <label key={d} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="discount"
                checked={filters.discount === d}
                onChange={() => applyFilters({ ...filters, discount: d })}
                className="accent-primary w-3.5 h-3.5" />
              <span className="text-xs text-gray-700 group-hover:text-primary transition-colors">
                {d}% or more
              </span>
            </label>
          ))}
          {filters.discount && (
            <button onClick={() => applyFilters({ ...filters, discount: '' })}
              className="text-[10px] text-primary hover:underline">
              Clear discount
            </button>
          )}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="AVAILABILITY">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox"
            checked={filters.inStock}
            onChange={() => applyFilters({ ...filters, inStock: !filters.inStock })}
            className="accent-primary w-3.5 h-3.5" />
          <span className="text-xs text-gray-700">In Stock Only</span>
        </label>
      </FilterSection>
    </aside>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar />
      <CategoryBar />

      <div className="flex-1 max-w-[1200px] mx-auto w-full px-3 sm:px-4 py-4">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{displayName}</span>
        </nav>

        <div className="flex gap-4 items-start">

          {/* ── Desktop sidebar ── */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded shadow-card p-4">
              <Sidebar />
            </div>
          </div>

          {/* ── Mobile filter drawer ── */}
          {mobileFiltersOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute inset-y-0 left-0 w-72 bg-white overflow-y-auto p-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-800">Filters</span>
                  <button onClick={() => setMobileFiltersOpen(false)}>
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                <Sidebar />
              </div>
            </div>
          )}

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">

            {/* Top bar */}
            <div className="bg-white rounded shadow-card px-4 py-3 flex items-center
                            justify-between flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-base font-semibold text-gray-900">{displayName}</h1>
                {!loading && (
                  <span className="text-xs text-gray-500">
                    ({total.toLocaleString()} product{total !== 1 ? 's' : ''})
                  </span>
                )}
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 text-xs font-medium
                             text-primary border border-primary px-3 py-1 rounded-full"
                >
                  <SlidersHorizontal size={12} />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-primary text-white text-[9px] font-bold
                                     w-4 h-4 rounded-full flex items-center justify-center">
                      {[filters.brands.length > 0, !!filters.minPrice || !!filters.maxPrice,
                        !!filters.rating, !!filters.discount, filters.inStock].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(v => !v)}
                  className="flex items-center gap-2 text-sm text-gray-700
                             border border-gray-300 px-3 py-1.5 rounded
                             hover:border-gray-400 transition-colors"
                >
                  <span className="text-xs text-gray-500">Sort By:</span>
                  <span className="text-xs font-semibold">
                    {SORT_OPTIONS.find(o => o.value === filters.sort)?.label}
                  </span>
                  <ChevronDown size={13} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded shadow-card-hover
                                  border border-gray-100 z-20 py-1 w-48">
                    {SORT_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { applyFilters({ ...filters, sort: o.value }); setSortOpen(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors
                                   ${filters.sort === o.value
                                     ? 'text-primary font-semibold bg-accent-light'
                                     : 'text-gray-700 hover:bg-surface'}`}
                      >
                        {o.value === filters.sort && <span className="mr-1">✓</span>}
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-3">
                {filters.brands.map(b => (
                  <button key={b} onClick={() => toggleBrand(b)}
                    className="flex items-center gap-1 text-xs bg-white border border-primary
                               text-primary px-2.5 py-1 rounded-full hover:bg-primary/5">
                    {b} <X size={10} />
                  </button>
                ))}
                {(filters.minPrice || filters.maxPrice) && (
                  <button onClick={() => { setPriceMin(''); setPriceMax(''); applyFilters({ ...filters, minPrice: '', maxPrice: '' }); }}
                    className="flex items-center gap-1 text-xs bg-white border border-primary
                               text-primary px-2.5 py-1 rounded-full hover:bg-primary/5">
                    ₹{filters.minPrice || '0'}–₹{filters.maxPrice || '∞'} <X size={10} />
                  </button>
                )}
                {filters.rating && (
                  <button onClick={() => applyFilters({ ...filters, rating: '' })}
                    className="flex items-center gap-1 text-xs bg-white border border-primary
                               text-primary px-2.5 py-1 rounded-full hover:bg-primary/5">
                    {filters.rating}★ & above <X size={10} />
                  </button>
                )}
                {filters.discount && (
                  <button onClick={() => applyFilters({ ...filters, discount: '' })}
                    className="flex items-center gap-1 text-xs bg-white border border-primary
                               text-primary px-2.5 py-1 rounded-full hover:bg-primary/5">
                    {filters.discount}%+ off <X size={10} />
                  </button>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="bg-white rounded shadow-card flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={36} className="animate-spin text-primary" />
                  <p className="text-sm text-gray-500">Loading products…</p>
                </div>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="bg-white rounded shadow-card flex flex-col items-center justify-center py-20 gap-4">
                <SearchX size={60} className="text-gray-200" />
                <p className="text-gray-600 font-medium">{error}</p>
                <button onClick={() => fetchProducts(filters, page)}
                  className="btn-primary text-sm">
                  Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && products.length === 0 && (
              <div className="bg-white rounded shadow-card flex flex-col items-center justify-center py-20 gap-4">
                <SearchX size={72} className="text-gray-200" />
                <p className="text-lg font-semibold text-gray-700">No products found</p>
                <p className="text-sm text-gray-500">
                  Try adjusting your filters or browse a different category.
                </p>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="btn-primary text-sm">
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Product grid */}
            {!loading && !error && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-200
                                border border-gray-200 rounded overflow-hidden shadow-card">
                  {products.map(p => (
                    <div key={p._id} className="bg-white">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-5">
                    <button
                      onClick={() => applyFilters(filters, page - 1)}
                      disabled={page === 1}
                      className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-white"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                      const n = i + 1;
                      return (
                        <button
                          key={n}
                          onClick={() => applyFilters(filters, n)}
                          className={`w-8 h-8 rounded text-sm font-medium border transition-colors
                                     ${page === n
                                       ? 'bg-primary text-white border-primary'
                                       : 'border-gray-300 hover:bg-surface text-gray-700'}`}
                        >
                          {n}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => applyFilters(filters, page + 1)}
                      disabled={page === pages}
                      className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-white"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    }>
      <CategoryPageInner />
    </Suspense>
  );
}
