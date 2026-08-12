'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    tag: 'Sale Live Now',
    title: 'Big Billion Days',
    subtitle: 'Deals that blow your mind every single day',
    cta: 'Shop Now',
    bg: 'from-gray-900 via-gray-800 to-rose-600',
    accent: 'bg-accent text-white',
    pattern: 'circles',
  },
  {
    id: 2,
    tag: 'New Launch',
    title: 'Latest Smartphones',
    subtitle: 'Get the newest tech at unbeatable prices',
    cta: 'Explore Phones',
    bg: 'from-purple-700 via-purple-600 to-pink-500',
    accent: 'bg-pink-300 text-purple-900',
    pattern: 'dots',
  },
  {
    id: 3,
    tag: 'Fashion Week',
    title: 'Wear What You Love',
    subtitle: 'Top brands, huge discounts — only this week',
    cta: 'Shop Fashion',
    bg: 'from-orange-500 via-red-500 to-pink-600',
    accent: 'bg-orange-200 text-red-900',
    pattern: 'lines',
  },
  {
    id: 4,
    tag: 'Home Makeover',
    title: 'Transform Your Space',
    subtitle: 'Furniture & decor starting at ₹499',
    cta: 'Shop Home',
    bg: 'from-emerald-600 via-teal-600 to-cyan-600',
    accent: 'bg-emerald-200 text-emerald-900',
    pattern: 'grid',
  },
];

function BgPattern({ type }: { type: string }) {
  if (type === 'circles') return (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
      {[120, 200, 300, 80].map((size, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2 border-white"
          style={{
            width: size, height: size,
            top: `${[10, 50, 30, 70][i]}%`, right: `${[5, 15, 30, 40][i]}%`,
          }}
        />
      ))}
    </div>
  );
  if (type === 'dots') return (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none"
         style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
  );
  if (type === 'lines') return (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none"
         style={{ backgroundImage: 'repeating-linear-gradient(45deg, white, white 1px, transparent 1px, transparent 12px)' }} />
  );
  return (
    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none"
         style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
  );
}

export default function HeroBanner() {
  const [current, setCurrent]   = useState(0);
  const [paused, setPaused]     = useState(false);
  const [animKey, setAnimKey]   = useState(0);

  const goTo = useCallback((idx: number) => {
    setCurrent((idx + slides.length) % slides.length);
    setAnimKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => goTo(current + 1), 4000);
    return () => clearInterval(id);
  }, [current, paused, goTo]);

  const slide = slides[current];

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide */}
      <div
        key={animKey}
        className={`bg-gradient-to-br ${slide.bg} relative`}
        style={{ minHeight: '280px' }}
      >
        <BgPattern type={slide.pattern} />

        {/* Content */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-10
                        flex flex-col sm:flex-row items-center justify-between
                        py-10 sm:py-14 gap-6">
          <div className="text-white animate-fade-in">
            <span className={`badge ${slide.accent} text-xs uppercase tracking-widest mb-3`}>
              {slide.tag}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mt-2">
              {slide.title}
            </h1>
            <p className="text-white/80 text-sm sm:text-base mt-2 max-w-xs">
              {slide.subtitle}
            </p>
            <button className="btn-primary mt-5 bg-white !text-gray-900 hover:!bg-accent-light shadow-lg">
              {slide.cta} →
            </button>
          </div>

          {/* Decorative product blob */}
          <div className="hidden sm:flex items-center justify-center w-48 h-48 lg:w-56 lg:h-56
                          rounded-full bg-white/20 backdrop-blur-sm shadow-2xl flex-shrink-0">
            <span className="text-6xl lg:text-7xl select-none">
              {['🛒', '📱', '👗', '🛋️'][current]}
            </span>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={() => goTo(current - 1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white
                   rounded-full p-1.5 shadow-md transition-all hover:scale-110 z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} className="text-gray-700" />
      </button>
      <button
        onClick={() => goTo(current + 1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white
                   rounded-full p-1.5 shadow-md transition-all hover:scale-110 z-20"
        aria-label="Next slide"
      >
        <ChevronRight size={20} className="text-gray-700" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-5 h-2 bg-white'
                : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
