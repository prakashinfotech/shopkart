'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Truck, ImageOff } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export interface HomepageProduct {
  _id: string;
  name: string;
  brand?: string;
  price: number;
  mrp: number;
  images: string[];
  ratings: number;
  numReviews: number;
  stock: number;
  isFeatured?: boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function fmtReviews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

export default function FeaturedProductCard({ product }: { product: HomepageProduct }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { addToCart } = (useCart() as any) ?? {};
  const [imgErr, setImgErr] = useState(false);

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const img = product.images?.[0] || '';
  const inStock = product.stock > 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart?.({
      id:    product._id,
      _id:   product._id,
      name:  product.name,
      price: product.price,
      mrp:   product.mrp,
      image: img,
      brand: product.brand,
      stock: product.stock,
    }, 1);
  }

  return (
    <Link
      href={`/product/${product._id}`}
      className="product-card group flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        {imgErr || !img ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <ImageOff size={36} />
            <span className="text-[10px] text-gray-400">Image unavailable</span>
          </div>
        ) : (
          <Image
            src={img}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImgErr(true)}
          />
        )}

        {product.isFeatured && (
          <span className="badge absolute top-2 left-2 bg-accent/10 text-accent">
            Best Seller
          </span>
        )}
        {discount >= 30 && !product.isFeatured && (
          <span className="badge absolute top-2 left-2 bg-green-100 text-green-700">
            {discount}% off
          </span>
        )}

        {/* Slide-up Add to Cart */}
        {inStock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-0 inset-x-0 bg-primary text-white text-xs font-semibold
                       py-2 flex items-center justify-center gap-1.5
                       translate-y-full group-hover:translate-y-0
                       transition-transform duration-200"
          >
            <ShoppingCart size={13} />
            Add to Cart
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        {product.brand && (
          <p className="text-[10px] text-muted font-medium uppercase tracking-wide">
            {product.brand}
          </p>
        )}
        <p className="text-sm text-gray-800 font-medium leading-snug line-clamp-2 flex-1">
          {product.name}
        </p>

        {/* Ratings */}
        {product.ratings > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 bg-green-600 text-white
                             text-xs font-semibold px-1.5 py-0.5 rounded">
              {product.ratings.toFixed(1)}
              <Star size={10} fill="white" className="flex-shrink-0" />
            </span>
            <span className="text-xs text-muted">({fmtReviews(product.numReviews)})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
          <span className="text-base font-bold text-gray-900">{fmt(product.price)}</span>
          {product.mrp > product.price && (
            <>
              <span className="text-xs text-muted line-through">{fmt(product.mrp)}</span>
              <span className="text-xs font-semibold text-green-600">{discount}% off</span>
            </>
          )}
        </div>

        {/* Free delivery */}
        <span className="flex items-center gap-1 text-[10px] text-primary font-medium mt-1">
          <Truck size={11} />
          Free Delivery
        </span>
      </div>
    </Link>
  );
}
