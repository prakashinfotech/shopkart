'use client';

import Link from 'next/link';

const categories = [
  { label: 'Grocery',      emoji: '🛒', href: '/category/grocery' },
  { label: 'Mobiles',      emoji: '📱', href: '/category/mobiles' },
  { label: 'Fashion',      emoji: '👗', href: '/category/fashion' },
  { label: 'Electronics',  emoji: '💻', href: '/category/electronics' },
  { label: 'Home',         emoji: '🛋️', href: '/category/home' },
  { label: 'Beauty',       emoji: '💄', href: '/category/beauty' },
  { label: 'Toys',         emoji: '🧸', href: '/category/toys' },
  { label: 'Sports',       emoji: '⚽', href: '/category/sports' },
  { label: 'Two Wheelers', emoji: '🏍️', href: '/category/two-wheelers' },
  { label: 'Appliances',   emoji: '🔌', href: '/category/appliances' },
  { label: 'Books',        emoji: '📚', href: '/category/books' },
];

export default function CategoryBar() {
  return (
    <div className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-2 sm:px-4">
        <div className="flex overflow-x-auto gap-1 py-2 no-scrollbar">
          {categories.map(({ label, emoji, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-1 px-3 sm:px-4 py-2
                         min-w-[70px] sm:min-w-[80px] rounded hover:text-primary
                         text-gray-700 transition-colors group flex-shrink-0"
            >
              <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">
                {emoji}
              </span>
              <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
