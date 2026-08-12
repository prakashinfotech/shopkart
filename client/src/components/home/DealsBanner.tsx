import Link from 'next/link';

const banners = [
  {
    title: 'Min. 40% Off',
    sub: 'Laptops & Accessories',
    emoji: '💻',
    bg: 'from-gray-800 to-gray-600',
    href: '/category/electronics',
  },
  {
    title: 'Top Brands Sale',
    sub: 'Nike, Puma, Adidas & more',
    emoji: '👟',
    bg: 'from-purple-600 to-pink-400',
    href: '/category/fashion',
  },
  {
    title: 'Kitchen Deals',
    sub: 'Up to 65% off appliances',
    emoji: '🍳',
    bg: 'from-rose-500 to-orange-400',
    href: '/category/home',
  },
];

export default function DealsBanner() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
      {banners.map(({ title, sub, emoji, bg, href }) => (
        <Link
          key={title}
          href={href}
          className={`bg-gradient-to-br ${bg} rounded-sm shadow-card
                      flex items-center gap-4 px-5 py-6
                      hover:shadow-card-hover hover:brightness-105
                      transition-all duration-200 group`}
        >
          <span className="text-4xl group-hover:scale-110 transition-transform">{emoji}</span>
          <div className="text-white">
            <p className="font-bold text-base leading-tight">{title}</p>
            <p className="text-white/80 text-xs mt-0.5">{sub}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}
