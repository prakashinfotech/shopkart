'use client';

import Image from 'next/image';
import { Clock, Search, X, TrendingUp } from 'lucide-react';
import { useSearch, APIProduct } from '@/context/SearchContext';

// Wrap matched text in a yellow highlight
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts   = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase()
          ? <mark key={i} className="bg-yellow-100 text-yellow-900 font-semibold not-italic px-0.5 rounded-sm">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

interface Props {
  onSelect:  (q: string) => void;
  activeIdx: number;
}

export default function SearchDropdown({ onSelect, activeIdx }: Props) {
  const { query, suggestions, recentSearches, clearRecent, removeRecent } = useSearch();

  const hasSuggestions = query.trim().length > 0 && suggestions.length > 0;
  const hasRecent      = !query.trim() && recentSearches.length > 0;

  if (!hasSuggestions && !hasRecent) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-0.5 bg-white rounded-b shadow-xl
                    border border-gray-100 z-[60] overflow-hidden">

      {/* ── Product suggestions ─────────────────────────────── */}
      {hasSuggestions && (
        <ul role="listbox">
          {suggestions.map((product: APIProduct, idx: number) => (
            <li
              key={product._id}
              role="option"
              aria-selected={idx === activeIdx}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                          ${idx === activeIdx ? 'bg-accent-light' : 'hover:bg-surface'}`}
              onMouseDown={(e) => { e.preventDefault(); onSelect(product.name); }}
            >
              {/* Thumbnail — explicit width/height so Next.js renders the image reliably */}
              <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-md border border-gray-100
                              overflow-hidden flex items-center justify-center">
                <Image
                  src={product.images?.[0] || 'https://placehold.co/48x48/e2e8f0/64748b?text=?'}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                  unoptimized={false}
                />
              </div>

              {/* Name + brand */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate leading-snug font-medium">
                  <HighlightText text={product.name} query={query} />
                </p>
                {product.brand && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{product.brand}</p>
                )}
              </div>

              {/* Price */}
              <span className="text-sm font-semibold text-primary flex-shrink-0">{fmt(product.price)}</span>
            </li>
          ))}

          {/* "Search for …" footer row */}
          <li
            role="option"
            aria-selected={activeIdx === suggestions.length}
            className={`flex items-center gap-2 px-4 py-3 cursor-pointer text-sm
                        text-primary font-medium border-t border-gray-100 transition-colors
                        ${activeIdx === suggestions.length ? 'bg-accent-light' : 'hover:bg-surface'}`}
            onMouseDown={(e) => { e.preventDefault(); onSelect(query); }}
          >
            <Search size={13} className="flex-shrink-0" />
            Search for &ldquo;<span className="font-bold">{query}</span>&rdquo;
          </li>
        </ul>
      )}

      {/* ── Recent searches ─────────────────────────────────── */}
      {hasRecent && (
        <>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-surface">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <Clock size={11} />
              Recent
            </span>
            <button
              onMouseDown={(e) => { e.preventDefault(); clearRecent(); }}
              className="text-xs text-primary hover:underline"
            >
              Clear all
            </button>
          </div>

          <ul>
            {recentSearches.map((r, idx) => (
              <li
                key={r}
                role="option"
                aria-selected={idx === activeIdx}
                className={`flex items-center gap-3 px-4 py-2.5 group cursor-pointer transition-colors
                            ${idx === activeIdx ? 'bg-accent-light' : 'hover:bg-surface'}`}
              >
                <Clock size={13} className="text-gray-400 flex-shrink-0" />
                <button
                  onMouseDown={(e) => { e.preventDefault(); onSelect(r); }}
                  className="flex-1 text-sm text-gray-700 text-left truncate"
                >
                  {r}
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); removeRecent(r); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700
                             transition-opacity flex-shrink-0 p-0.5"
                  aria-label="Remove"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>

          {/* Trending hint when no query */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-gray-400 border-t border-gray-100">
            <TrendingUp size={12} />
            Type to search products, brands &amp; categories
          </div>
        </>
      )}
    </div>
  );
}
