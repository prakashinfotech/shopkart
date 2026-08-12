'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, ShoppingCart, Zap, Truck, ShieldCheck, RefreshCw,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, Plus, Minus,
  CheckCircle2, Heart, Share2,
} from 'lucide-react';
import Navbar      from '@/components/layout/Navbar';
import Footer      from '@/components/layout/Footer';
import CategoryBar from '@/components/home/CategoryBar';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

interface APIVariant {
  type:   string;
  value:  string;
  price?: number;
  mrp?:   number;
  stock?: number;
  images?: string[];
}

interface APIProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  mrp: number;
  images: string[];
  brand?: string;
  ratings: number;
  numReviews: number;
  stock: number;
  isFeatured?: boolean;
  specs?: Record<string, string>;
  variants?: APIVariant[];
  category?: { _id: string; name: string; slug: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}
function formatReviews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

const DEMO_OFFERS = [
  { icon: '💳', title: 'Bank Offer',    desc: '10% off on HDFC Bank Cards, up to ₹1,500 on orders of ₹5,000 and above' },
  { icon: '🏷️', title: 'Special Price', desc: 'Get extra 5% off (price inclusive of cashback/coupon)' },
  { icon: '🔄', title: 'Partner Offer', desc: 'Purchase with exchange and get up to ₹10,000 off' },
];

const DEMO_SELLERS = ['SuperTech India', 'RetailHub', 'TechWorld Store', 'ValueMart'];

// ── Small product card for similar products ────────────────────────────────────

function SimilarCard({ product }: { product: APIProduct }) {
  const [imgErr, setImgErr] = useState(false);
  const pct = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const img = product.images?.[0] || '';

  return (
    <Link href={`/product/${product._id}`}
      className="flex-shrink-0 w-36 sm:w-44 bg-white border border-gray-100 rounded-sm
                 hover:shadow-card-hover hover:border-gray-200 transition-all group">
      <div className="aspect-square bg-gray-50 overflow-hidden rounded-t-sm">
        {img && !imgErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <ShoppingCart size={32} />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-snug mb-1">{product.name}</p>
        {product.ratings > 0 && (
          <span className="inline-flex items-center gap-0.5 bg-green-600 text-white
                           text-[10px] font-semibold px-1.5 py-0.5 rounded mb-1">
            {product.ratings.toFixed(1)} <Star size={8} fill="white" />
          </span>
        )}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm font-bold text-gray-900">₹{fmt(product.price)}</span>
          {pct > 0 && <span className="text-[10px] font-semibold text-green-600">{pct}% off</span>}
        </div>
      </div>
    </Link>
  );
}

// ── Star rating bar ────────────────────────────────────────────────────────────

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={14}
            className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'} />
        ))}
      </div>
      <span className="text-sm text-gray-500">
        {rating.toFixed(1)} ({formatReviews(count)} ratings)
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = params?.id as string;

  useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { addToCart } = (useCart() as any) ?? {};

  const [product,          setProduct]          = useState<APIProduct | null>(null);
  const [similar,          setSimilar]          = useState<APIProduct[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [activeImg,        setActiveImg]        = useState(0);
  const [qty,              setQty]              = useState(1);
  const [adding,           setAdding]           = useState(false);
  const [added,            setAdded]            = useState(false);
  const [pincode,          setPincode]          = useState('');
  const [pinOk,            setPinOk]            = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [seller]  = useState(() => DEMO_SELLERS[Math.floor(Math.random() * DEMO_SELLERS.length)]);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/products/${id}`),
        fetch(`/api/products/${id}/similar`),
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();

      if (!pRes.ok) throw new Error(pData.message || 'Product not found');
      setProduct(pData.product);
      setSimilar(sData.products ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  // Reset active image and auto-select first variant option per type when product changes
  useEffect(() => {
    setActiveImg(0);
    if (product?.variants?.length) {
      const defaults: Record<string, string> = {};
      for (const v of product.variants) {
        if (!defaults[v.type]) defaults[v.type] = v.value;
      }
      setSelectedVariants(defaults);
    } else {
      setSelectedVariants({});
    }
  }, [product?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group variants by type
  const variantGroups = useMemo(() => {
    if (!product?.variants?.length) return {} as Record<string, APIVariant[]>;
    return product.variants.reduce<Record<string, APIVariant[]>>((acc, v) => {
      (acc[v.type] ??= []).push(v);
      return acc;
    }, {});
  }, [product?.variants]);

  // Effective price/mrp/stock/images from selected variant overrides
  const effectivePrice = useMemo(() => {
    for (const [type, value] of Object.entries(selectedVariants)) {
      const v = product?.variants?.find(v => v.type === type && v.value === value);
      if (v?.price != null) return v.price;
    }
    return product?.price ?? 0;
  }, [selectedVariants, product]);

  const effectiveMrp = useMemo(() => {
    for (const [type, value] of Object.entries(selectedVariants)) {
      const v = product?.variants?.find(v => v.type === type && v.value === value);
      if (v?.mrp != null) return v.mrp;
    }
    return product?.mrp ?? 0;
  }, [selectedVariants, product]);

  const effectiveStock = useMemo(() => {
    for (const [type, value] of Object.entries(selectedVariants)) {
      const v = product?.variants?.find(v => v.type === type && v.value === value);
      if (v?.stock != null) return v.stock;
    }
    return product?.stock ?? 0;
  }, [selectedVariants, product]);

  const effectiveImages = useMemo(() => {
    for (const [type, value] of Object.entries(selectedVariants)) {
      const v = product?.variants?.find(v => v.type === type && v.value === value);
      if (v?.images?.length) return v.images;
    }
    return product?.images ?? [];
  }, [selectedVariants, product]);

  if (!product && loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar /><CategoryBar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={40} className="animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || (!loading && !product)) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar /><CategoryBar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
          <AlertCircle size={60} className="text-gray-200" />
          <p className="text-lg font-semibold text-gray-700">{error || 'Product not found'}</p>
          <Link href="/" className="btn-primary">Back to Home</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const p           = product!;
  const images      = effectiveImages.length ? effectiveImages : (p.images?.length ? p.images : ['']);
  const pct         = effectiveMrp > effectivePrice
                        ? Math.round(((effectiveMrp - effectivePrice) / effectiveMrp) * 100) : 0;
  const savings     = effectiveMrp - effectivePrice;
  const inStock     = effectiveStock > 0;
  const specEntries = p.specs ? Object.entries(p.specs) : [];

  async function handleAddToCart() {
    if (!inStock) return;
    setAdding(true);
    await addToCart?.({
      ...p,
      id:    p._id,
      price: effectivePrice,
      mrp:   effectiveMrp,
      image: images[0],
    }, qty);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  async function handleBuyNow() {
    if (!inStock) return;
    await addToCart?.({
      ...p,
      id:    p._id,
      price: effectivePrice,
      mrp:   effectiveMrp,
      image: images[0],
    }, qty);
    router.push('/checkout');
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar />
      <CategoryBar />

      <div className="flex-1 max-w-[1200px] mx-auto w-full px-3 sm:px-4 py-4">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 flex-wrap">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          {p.category && (
            <>
              <Link href={`/category/${p.category.slug}`}
                className="hover:text-primary capitalize">
                {p.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-800 line-clamp-1 max-w-[200px]">{p.name}</span>
        </nav>

        {/* ── Main product section ── */}
        <div className="bg-white rounded shadow-card overflow-hidden mb-4">
          <div className="flex flex-col lg:flex-row">

            {/* ── LEFT: Image gallery ── */}
            <div className="lg:w-[420px] flex-shrink-0 flex flex-col sm:flex-row lg:flex-row
                            border-b lg:border-b-0 lg:border-r border-gray-100">

              {/* Thumbnails column */}
              {images.length > 1 && (
                <div className="flex sm:flex-col lg:flex-col gap-2 p-3
                                overflow-x-auto sm:overflow-x-hidden sm:overflow-y-auto
                                sm:w-20 lg:w-20 flex-shrink-0 order-last sm:order-first">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-16 h-16 flex-shrink-0 border-2 rounded overflow-hidden
                                 transition-all
                                 ${activeImg === i ? 'border-primary' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`img-${i}`}
                        className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="relative flex-1 flex items-center justify-center p-6
                              min-h-[300px] sm:min-h-[360px] lg:min-h-[420px] group">
                {images[activeImg] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={images[activeImg]}
                    alt={p.name}
                    className="max-w-full max-h-[380px] object-contain
                               group-hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                  />
                ) : (
                  <div className="flex items-center justify-center text-gray-200">
                    <ShoppingCart size={80} />
                  </div>
                )}

                {/* Prev/Next arrows when multiple images */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg(i => Math.max(i - 1, 0))}
                      disabled={activeImg === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8
                                 bg-white/90 rounded-full shadow flex items-center justify-center
                                 disabled:opacity-30 hover:bg-white transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setActiveImg(i => Math.min(i + 1, images.length - 1))}
                      disabled={activeImg === images.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8
                                 bg-white/90 rounded-full shadow flex items-center justify-center
                                 disabled:opacity-30 hover:bg-white transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}

                {/* Dot indicators */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all
                                   ${activeImg === i ? 'bg-primary w-4' : 'bg-gray-300'}`} />
                    ))}
                  </div>
                )}

                {/* Assured badge */}
                {p.isFeatured && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary
                                  text-white text-[9px] font-bold px-2 py-1 rounded-sm">
                    <ShieldCheck size={10} />
                    ShopKart Assured
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Product info ── */}
            <div className="flex-1 p-5 lg:p-6 flex flex-col gap-4">

              {/* Title + share/wishlist */}
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-medium text-gray-900 leading-snug">{p.name}</h1>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <Heart size={18} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-primary transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Ratings */}
              {p.ratings > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-green-600 text-white
                                  text-sm font-semibold px-2 py-0.5 rounded">
                    {p.ratings.toFixed(1)}
                    <Star size={12} fill="white" />
                  </div>
                  <StarDisplay rating={p.ratings} count={p.numReviews} />
                </div>
              )}

              <div className="border-t border-gray-100" />

              {/* Variant selectors */}
              {Object.keys(variantGroups).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(variantGroups).map(([type, options]) => (
                    <div key={type}>
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        {type}:
                        <span className="font-normal text-gray-900 ml-1">
                          {selectedVariants[type]}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {options.map(opt => {
                          const isSelected = selectedVariants[type] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => {
                                setSelectedVariants(prev => ({ ...prev, [type]: opt.value }));
                                setActiveImg(0);
                              }}
                              className={`px-3 py-1.5 text-sm border-2 rounded transition-all font-medium
                                         ${isSelected
                                           ? 'border-primary text-primary bg-accent-light'
                                           : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                            >
                              {opt.value}
                              {opt.price != null && (
                                <span className="ml-1.5 text-xs font-normal text-gray-500">
                                  ₹{fmt(opt.price)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-100" />
                </div>
              )}

              {/* Price section */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Special Price</p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-bold text-gray-900">₹{fmt(effectivePrice)}</span>
                  {effectiveMrp > effectivePrice && (
                    <>
                      <span className="text-base text-gray-400 line-through">₹{fmt(effectiveMrp)}</span>
                      <span className="text-base font-semibold text-green-600">{pct}% off</span>
                    </>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    You save ₹{fmt(savings)}
                  </p>
                )}
              </div>

              {/* Offers */}
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">Available Offers</p>
                <div className="space-y-2">
                  {DEMO_OFFERS.map((o, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="flex-shrink-0 mt-0.5">{o.icon}</span>
                      <div>
                        <span className="font-semibold text-gray-800">{o.title}</span>
                        <span className="text-gray-600"> {o.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Delivery */}
              <div className="flex gap-3 text-sm text-gray-700">
                <Truck size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Delivery</span>
                    {!pinOk ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={pincode}
                          onChange={e => setPincode(e.target.value.replace(/\D/g,'').slice(0,6))}
                          placeholder="Enter pincode"
                          className="border-b border-gray-400 outline-none text-xs w-24 pb-0.5"
                        />
                        <button
                          onClick={() => { if (pincode.length === 6) setPinOk(true); }}
                          className="text-xs text-primary font-semibold hover:underline">
                          Check
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">{pincode}
                        <button onClick={() => setPinOk(false)}
                          className="text-primary ml-1 hover:underline">Change</button>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {pinOk
                      ? <span className="text-green-600 font-medium">FREE delivery by Tomorrow</span>
                      : 'Enter pincode to check delivery date'}
                  </p>
                </div>
              </div>

              {/* Seller */}
              <div className="flex gap-3 text-sm text-gray-700">
                <ShieldCheck size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Seller </span>
                  <span className="text-primary font-medium">{seller}</span>
                  <span className="text-gray-500 text-xs ml-2">
                    {p.isFeatured ? '✓ ShopKart Assured' : '4.5★ Seller Rating'}
                  </span>
                </div>
              </div>

              {/* Warranty / Returns */}
              <div className="flex gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <RefreshCw size={14} className="text-gray-400" />
                  7 Days Return
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-gray-400" />
                  1 Year Warranty
                </div>
              </div>

              <div className="border-t border-gray-100" />

              {/* Stock status */}
              {!inStock && (
                <div className="flex items-center gap-2 text-red-500 font-semibold text-sm">
                  <AlertCircle size={16} />
                  Out of Stock
                </div>
              )}

              {/* Quantity */}
              {inStock && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-8 h-8 flex items-center justify-center
                                 text-primary hover:bg-gray-50 transition-colors">
                      <Minus size={13} />
                    </button>
                    <span className="w-10 h-8 flex items-center justify-center
                                     text-sm font-semibold border-x border-gray-300">
                      {qty}
                    </span>
                    <button onClick={() => setQty(q => Math.min(effectiveStock, q + 1))}
                      className="w-8 h-8 flex items-center justify-center
                                 text-primary hover:bg-gray-50 transition-colors">
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">({effectiveStock} available)</span>
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock || adding}
                  className={`flex items-center gap-2 px-8 py-3 rounded text-sm font-bold
                             transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                             ${added
                               ? 'bg-green-600 text-white'
                               : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'}`}
                >
                  {adding ? <Loader2 size={16} className="animate-spin" />
                    : added ? <CheckCircle2 size={16} />
                    : <ShoppingCart size={16} />}
                  {adding ? 'Adding…' : added ? 'Added!' : 'Add to Cart'}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={!inStock}
                  className="flex items-center gap-2 px-8 py-3 rounded text-sm font-bold
                             bg-primary text-white hover:brightness-110 active:scale-95
                             transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={16} />
                  Buy Now
                </button>
              </div>

              {/* Highlights */}
              {p.description && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1.5">Highlights</p>
                  <ul className="text-sm text-gray-600 space-y-1 pl-4">
                    {p.description.split('.').filter(s => s.trim().length > 10).slice(0, 4).map((s, i) => (
                      <li key={i} className="list-disc">{s.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Specifications ── */}
        {(specEntries.length > 0 || p.description) && (
          <div className="bg-white rounded shadow-card p-5 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Product Details</h2>

            {p.description && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>
              </div>
            )}

            {specEntries.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Specifications</h3>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {specEntries.map(([key, value], i) => (
                      <tr key={key} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-2 px-4 font-medium text-gray-600 w-1/3 border border-gray-100">
                          {key}
                        </td>
                        <td className="py-2 px-4 text-gray-800 border border-gray-100">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Ratings summary */}
            {p.ratings > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Ratings &amp; Reviews</h3>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{p.ratings.toFixed(1)}</div>
                    <StarDisplay rating={p.ratings} count={p.numReviews} />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatReviews(p.numReviews)} Verified Ratings
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Similar products ── */}
        {similar.length > 0 && (
          <div className="bg-white rounded shadow-card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Similar Products</h2>
              {p.category && (
                <Link href={`/category/${p.category.slug}`}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                  View all <ChevronRight size={12} />
                </Link>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {similar.map(s => <SimilarCard key={s._id} product={s} />)}
            </div>
          </div>
        )}

        {/* ── Guarantees banner ── */}
        <div className="bg-white rounded shadow-card p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs text-gray-600">
            {[
              { icon: <ShieldCheck size={24} className="text-primary mx-auto mb-1.5" />, label: '100% Authentic' },
              { icon: <Truck size={24} className="text-primary mx-auto mb-1.5" />,       label: 'Free Delivery'  },
              { icon: <RefreshCw size={24} className="text-primary mx-auto mb-1.5" />,   label: 'Easy Returns'   },
              { icon: <CheckCircle2 size={24} className="text-green-600 mx-auto mb-1.5" />, label: 'Quality Assured'},
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center">
                {icon}
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
