import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import FeaturedProductCard, { type HomepageProduct } from './FeaturedProductCard';
import ProductCard from '@/components/product/ProductCard';
import { products as localProducts } from '@/lib/data';
import type { Product } from '@/lib/data';

// ── API fetch (server-side, no rewrites — uses full backend URL) ───────────────

async function fetchFromAPI(categorySlug?: string, limit = 8): Promise<HomepageProduct[]> {
  try {
    const base = process.env.BACKEND_URL ?? 'http://localhost:5000';
    const qs   = new URLSearchParams({ limit: String(limit), sort: 'relevance' });
    const url  = categorySlug
      ? `${base}/api/products/category/${categorySlug}?${qs}`
      : `${base}/api/products/search?${qs}`;

    const res = await fetch(url, {
      next: { revalidate: 60 },  // refresh data every minute
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products ?? []) as HomepageProduct[];
  } catch {
    return [];
  }
}

// ── Section shell ──────────────────────────────────────────────────────────────

function SectionShell({
  title, subtitle, viewAllHref, children,
}: {
  title: string; subtitle?: string; viewAllHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-sm shadow-card overflow-hidden mt-4">
      <div className="flex items-end justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
        <Link
          href={viewAllHref}
          className="flex items-center gap-0.5 text-primary text-xs font-semibold
                     hover:gap-1.5 transition-all"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 divide-x divide-y divide-gray-100">
        {children}
      </div>
    </section>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  title:         string;
  subtitle?:     string;
  /** MongoDB category slug (e.g. 'electronics', 'mobiles'). Omit for featured mix. */
  categorySlug?: string;
  /** Override the "View All" link (defaults to /category/<categorySlug>) */
  viewAllHref?:  string;
  /** Legacy fallback — local data category key used when API returns nothing */
  filter?:       Product['category'];
}

// ── Main component (async Server Component) ───────────────────────────────────

export default async function ProductGrid({
  title, subtitle, categorySlug, viewAllHref, filter,
}: Props) {
  const viewAll = viewAllHref ?? (categorySlug ? `/category/${categorySlug}` : '/');

  // 1. Try the live API
  const apiProducts = await fetchFromAPI(categorySlug);

  if (apiProducts.length > 0) {
    return (
      <SectionShell title={title} subtitle={subtitle} viewAllHref={viewAll}>
        {apiProducts.map(p => (
          <FeaturedProductCard key={p._id} product={p} />
        ))}
      </SectionShell>
    );
  }

  // 2. Fallback: render from local data.ts (backend may not be running)
  if (filter) {
    const local = localProducts.filter(p => p.category === filter);
    if (local.length === 0) return null;
    return (
      <SectionShell title={title} subtitle={subtitle} viewAllHref={viewAll}>
        {local.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </SectionShell>
    );
  }

  return null;
}
