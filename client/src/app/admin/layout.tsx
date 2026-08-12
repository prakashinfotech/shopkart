'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NAV = [
  { href: '/admin',          icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/products', icon: Package,          label: 'Products'  },
  { href: '/admin/orders',   icon: ShoppingBag,      label: 'Orders'    },
  { href: '/admin/users',    icon: Users,            label: 'Users'     },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-white font-bold text-lg tracking-tight">
            Shop<span className="text-accent">Kart</span>
          </span>
          <span className="text-purple-300 text-[10px] font-semibold tracking-widest uppercase mt-0.5">
            Admin Panel
          </span>
        </Link>
      </div>

      {/* User chip */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center
                          text-white text-sm font-bold flex-shrink-0">
            {user.name[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user.name}</p>
            <p className="text-purple-300 text-[10px] truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                          transition-all group
                          ${active
                            ? 'bg-white/15 text-white'
                            : 'text-purple-200 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon size={16} className="flex-shrink-0" />
              {label}
              {active && <ChevronRight size={12} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-purple-200
                     hover:bg-white/10 hover:text-white transition-all"
        >
          <ShoppingBag size={15} />
          View Store
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-300
                     hover:bg-red-500/20 hover:text-red-200 transition-all w-full text-left"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface">

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 bg-gradient-to-b from-slate-800 to-slate-900
                        flex-shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ────────────────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-56 bg-gradient-to-b from-slate-800 to-slate-900
                            flex flex-col shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">

        {/* Top bar (mobile only) */}
        <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-20
                           flex items-center gap-3 px-4 h-12">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-gray-800">Admin Panel</span>
          <button
            onClick={handleLogout}
            className="ml-auto text-gray-500 hover:text-red-600"
            aria-label="Logout"
          >
            <LogOut size={17} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
