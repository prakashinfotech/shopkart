import Navbar       from '@/components/layout/Navbar';
import Footer       from '@/components/layout/Footer';
import HeroBanner   from '@/components/home/HeroBanner';
import CategoryBar  from '@/components/home/CategoryBar';
import ProductGrid  from '@/components/home/ProductGrid';
import DealsBanner  from '@/components/home/DealsBanner';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <CategoryBar />

      <main className="flex-1">
        <HeroBanner />

        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 space-y-4 pb-8">

          {/* Featured deals — all isFeatured products sorted by rating */}
          <ProductGrid
            title="Today's Deals"
            subtitle="Up to 70% off — best prices guaranteed"
            viewAllHref="/category/electronics"
            filter="deals"
          />

          <DealsBanner />

          {/* Electronics — Smartphones, Laptops, Tablets, Audio, Cameras */}
          <ProductGrid
            title="Top Electronics"
            subtitle="Best picks across phones, laptops & more"
            categorySlug="electronics"
            viewAllHref="/category/electronics"
            filter="electronics"
          />

          {/* Mobiles — Mobile Phones & Accessories */}
          <ProductGrid
            title="Best Selling Mobiles"
            subtitle="Top smartphones at great prices"
            categorySlug="mobiles"
            viewAllHref="/category/mobiles"
          />

          {/* Fashion */}
          <ProductGrid
            title="Fashion Favourites"
            subtitle="Trending styles for men, women & kids"
            categorySlug="fashion"
            viewAllHref="/category/fashion"
            filter="fashion"
          />

          {/* Beauty */}
          <ProductGrid
            title="Beauty & Skincare"
            subtitle="Glow up with top skincare & makeup brands"
            categorySlug="beauty"
            viewAllHref="/category/beauty"
          />

          {/* Toys */}
          <ProductGrid
            title="Toys for Every Age"
            subtitle="Educational & fun — for little ones to teens"
            categorySlug="toys"
            viewAllHref="/category/toys"
          />

          {/* Two Wheelers */}
          <ProductGrid
            title="Two Wheelers"
            subtitle="Bikes & scooters from top brands"
            categorySlug="two-wheelers"
            viewAllHref="/category/two-wheelers"
          />

        </div>
      </main>

      <Footer />
    </div>
  );
}
