'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, ShoppingCart, User, ChevronDown,
  Menu, X, Bell, Heart, MapPin, LogOut, LayoutDashboard,
} from 'lucide-react';
import { useAuth }   from '@/context/AuthContext';
import { useCart }   from '@/context/CartContext';
import { useSearch } from '@/context/SearchContext';
import SearchDropdown from '@/components/search/SearchDropdown';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cartCount: number = (useCart() as any)?.cartCount ?? 0;

  const {
    query, setQuery,
    suggestions, recentSearches,
    suggestionsOpen, setSuggestionsOpen,
  } = useSearch();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeIdx,  setActiveIdx]  = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);

  // Total items navigable in the dropdown (suggestions + "Search for…" row OR recent items)
  const dropdownLength = query.trim()
    ? suggestions.length + 1   // +1 for "Search for …" footer
    : recentSearches.length;

  // Close dropdown when clicking outside the search container
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [setSuggestionsOpen]);

  // Reset active index whenever suggestions list changes
  useEffect(() => { setActiveIdx(-1); }, [suggestions, recentSearches]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    router.push('/');
  };

  const displayName = user ? user.name.split(' ')[0].slice(0, 10) : '';

  // Navigate to search results page
  const submitSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    setSuggestionsOpen(false);
    setActiveIdx(-1);
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }, [router, setSuggestionsOpen]);

  // Called when user clicks/keyboard-selects a dropdown item
  const handleSelect = useCallback((q: string) => {
    setQuery(q);
    submitSearch(q);
  }, [setQuery, submitSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen) {
      if (e.key === 'Enter') submitSearch(query);
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx(prev => Math.min(prev + 1, dropdownLength - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter': {
        e.preventDefault();
        if (activeIdx >= 0 && activeIdx < suggestions.length) {
          handleSelect(suggestions[activeIdx].name);
        } else if (activeIdx === suggestions.length && query.trim()) {
          // "Search for …" footer row
          handleSelect(query);
        } else if (!query.trim() && activeIdx >= 0 && activeIdx < recentSearches.length) {
          handleSelect(recentSearches[activeIdx]);
        } else {
          submitSearch(query);
        }
        break;
      }
      case 'Escape':
        setSuggestionsOpen(false);
        setActiveIdx(-1);
        break;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-nav">
      {/* ── Main bar ── */}
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 h-14 flex items-center gap-3">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex flex-col leading-none mr-2">
          <span className="text-white font-bold text-xl tracking-tight">
            Shop<span className="text-accent">Kart</span>
          </span>
          <span className="text-gray-400 text-[10px] italic -mt-0.5 hidden sm:block">
            Explore <span className="text-accent">Plus</span> ✦
          </span>
        </Link>

        {/* Search bar — wrapper is relative so dropdown can overlay below */}
        <div className="flex-1 flex min-w-0">
          <div ref={searchRef} className="relative w-full">

            {/* Input row — overflow-hidden only on inner row, not the wrapper */}
            <div className="flex rounded overflow-hidden shadow-md">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => { if (query.trim() || recentSearches.length) setSuggestionsOpen(true); }}
                onKeyDown={handleKeyDown}
                placeholder="Search for products, brands and more"
                aria-label="Search"
                aria-autocomplete="list"
                aria-expanded={suggestionsOpen}
                className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 outline-none
                           placeholder:text-gray-400 bg-white"
              />
              {/* Clear button — visible when there's text */}
              {query && (
                <button
                  onClick={() => { setQuery(''); setSuggestionsOpen(false); }}
                  className="bg-white px-2 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => submitSearch(query)}
                className="bg-primary-dark text-white px-4 text-sm font-semibold
                           hover:bg-black transition-colors flex items-center gap-1 flex-shrink-0"
                aria-label="Search"
              >
                <Search size={14} />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>

            {/* Suggestions / recent dropdown */}
            {suggestionsOpen && (
              <SearchDropdown onSelect={handleSelect} activeIdx={activeIdx} />
            )}
          </div>
        </div>

        {/* Desktop right actions */}
        <nav className="hidden md:flex items-center gap-1 flex-shrink-0">

          {/* User menu */}
          <div className="group relative">
            <button className="btn-outline flex items-center gap-1.5 py-1.5 px-4">
              <User size={15} />
              <span className="max-w-[80px] truncate">
                {user ? displayName : 'Login'}
              </span>
              <ChevronDown size={13} className="group-hover:rotate-180 transition-transform" />
            </button>

            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded shadow-card-hover
                            opacity-0 invisible group-hover:opacity-100 group-hover:visible
                            transition-all duration-150 z-50 py-2">
              {user ? (
                <>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                    {user.role === 'admin' && (
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase
                                       bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  {[
                    { icon: User,   label: 'My Profile',     href: '/account' },
                    { icon: Bell,   label: 'My Orders',       href: '/orders'  },
                    { icon: Heart,  label: 'Wishlist',        href: '/wishlist'},
                    { icon: MapPin, label: 'Saved Addresses', href: '/account' },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link key={label} href={href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                                 hover:bg-surface transition-colors">
                      <Icon size={14} className="text-muted" />
                      {label}
                    </Link>
                  ))}
                  {user.role === 'admin' && (
                    <Link href="/admin"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold
                                 text-purple-700 hover:bg-purple-50 transition-colors">
                      <LayoutDashboard size={14} />
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="border-t border-gray-100 mt-1">
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600
                                 hover:bg-red-50 transition-colors w-full text-left">
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-600">New customer?</span>
                    <Link href="/register" className="text-primary text-sm font-semibold hover:underline">
                      Sign up
                    </Link>
                  </div>
                  <Link href="/login"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary
                               font-semibold hover:bg-surface transition-colors">
                    <User size={14} />
                    Login
                  </Link>
                  {[
                    { icon: Bell,   label: 'My Orders',    href: '/orders'  },
                    { icon: Heart,  label: 'Wishlist',     href: '/wishlist'},
                    { icon: MapPin, label: 'My Addresses', href: '/account' },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link key={label} href={href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                                 hover:bg-surface transition-colors">
                      <Icon size={14} className="text-muted" />
                      {label}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>

          {user?.role === 'admin' ? (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-accent text-sm font-semibold
                         px-3 py-1.5 hover:text-white transition-colors whitespace-nowrap"
            >
              <LayoutDashboard size={15} />
              Admin
            </Link>
          ) : (
            <button className="text-white text-sm font-semibold px-3 py-1.5 hover:text-accent
                               transition-colors whitespace-nowrap">
              Become a Seller
            </button>
          )}

          {/* Cart */}
          <Link href="/cart"
            className="relative flex items-center gap-1.5 text-white text-sm
                       font-semibold px-3 py-1.5 hover:text-accent transition-colors">
            <div className="relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px]
                                 font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span className="hidden lg:inline">Cart</span>
          </Link>
        </nav>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-2 flex-shrink-0">
          <Link href="/cart" className="relative text-white p-1">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px]
                               font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          <button onClick={() => setMobileOpen(v => !v)}
            className="text-white p-1" aria-label="Toggle menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in">
          {user && (
            <div className={`px-5 py-3 border-b ${user.role === 'admin' ? 'bg-purple-50 border-purple-100' : 'bg-accent-light border-rose-100'}`}>
              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
              {user.role === 'admin' && (
                <span className="inline-block mt-1 text-[10px] font-bold uppercase
                                 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
          )}
          <div className="divide-y divide-gray-100">
            {!user && (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block px-5 py-3 text-sm font-semibold text-primary">
                Login / Sign up
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-purple-700
                           bg-purple-50">
                <LayoutDashboard size={15} />
                Admin Dashboard
              </Link>
            )}
            {[
              { label: 'My Orders',       href: '/orders'   },
              { label: 'Wishlist',        href: '/wishlist' },
              { label: 'My Account',      href: '/account'  },
              { label: 'Become a Seller', href: '#'         },
            ].map(({ label, href }) => (
              <Link key={label} href={href} onClick={() => setMobileOpen(false)}
                className="block px-5 py-3 text-sm text-gray-700">
                {label}
              </Link>
            ))}
            {user && (
              <button onClick={handleLogout}
                className="block w-full text-left px-5 py-3 text-sm text-red-600 font-medium">
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
