'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, UserPlus, Shield, Truck, RotateCcw, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const BENEFITS = [
  { icon: ShoppingBag, text: '5 Crore+ Products' },
  { icon: Truck,       text: 'Free & Fast Delivery' },
  { icon: Shield,      text: '100% Secure Payments' },
  { icon: RotateCcw,   text: 'Easy Returns & Refunds' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setBusy(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-[800px] flex rounded-lg shadow-card-hover overflow-hidden">

        {/* ── Left panel ───────────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-b from-primary to-primary-dark
                        text-white p-10 w-[44%] flex-shrink-0">
          <div>
            <div className="mb-8">
              <span className="text-3xl font-extrabold tracking-tight">
                Shop<span className="text-accent">Kart</span>
              </span>
              <span className="block text-gray-400 text-xs italic mt-0.5">
                Explore <span className="text-accent">Plus</span> ✦
              </span>
            </div>

            <h2 className="text-2xl font-bold leading-snug">
              Looks like you're
              <br />
              new here!
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Sign up with your email to get started
            </p>

            <ul className="mt-8 space-y-4">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-6xl select-none text-center opacity-30 mt-10">
            <UserPlus size={60} className="mx-auto" />
          </div>
        </div>

        {/* ── Right panel — form ────────────────────────────────────────────── */}
        <div className="flex-1 bg-white p-8 sm:p-10">

          <div className="md:hidden mb-6 text-center">
            <span className="text-2xl font-extrabold text-primary">
              Shop<span className="text-accent">Kart</span>
            </span>
          </div>

          <h1 className="text-xl font-semibold text-gray-800 mb-1">Create Account</h1>
          <p className="text-muted text-sm mb-6">
            Join millions of happy ShopKart customers
          </p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm
                            rounded px-4 py-3 flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Enter your full name"
                required
                autoComplete="name"
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm
                           outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="Enter your email"
                required
                autoComplete="email"
                className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm
                           outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Create a password (min. 6 chars)"
                  required
                  autoComplete="new-password"
                  className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm
                             outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                             placeholder:text-gray-400 pr-11 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted
                             hover:text-gray-700 transition-colors"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {/* Strength hint */}
              {password.length > 0 && (
                <p className={`text-xs mt-1 ${password.length >= 8 ? 'text-green-600' : 'text-orange-500'}`}>
                  {password.length >= 8 ? '✓ Strong password' : 'Use 8+ characters for a stronger password'}
                </p>
              )}
            </div>

            <p className="text-xs text-muted leading-relaxed">
              By continuing, you agree to ShopKart's{' '}
              <span className="text-primary cursor-pointer hover:underline">Terms of Use</span>
              {' '}and{' '}
              <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            <button
              type="submit"
              disabled={busy}
              className="w-full btn-primary flex items-center justify-center gap-2
                         disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-muted">Existing user?</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <Link
            href="/login"
            className="block w-full text-center border border-primary text-primary text-sm
                       font-semibold py-2.5 rounded hover:bg-surface transition-colors"
          >
            Login Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
