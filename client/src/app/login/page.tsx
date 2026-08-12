'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShoppingBag, Shield, Truck, RotateCcw, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Admin',   email: 'admin@flipkart.com', password: 'Admin@1234', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { label: 'User 1',  email: 'user1@flipkart.com', password: 'User@1234',  color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { label: 'User 2',  email: 'user2@flipkart.com', password: 'User@1234',  color: 'bg-green-100 text-green-700 border-green-200' },
];

const BENEFITS = [
  { icon: ShoppingBag, text: '5 Crore+ Products' },
  { icon: Truck,       text: 'Free & Fast Delivery' },
  { icon: Shield,      text: '100% Secure Payments' },
  { icon: RotateCcw,   text: 'Easy Returns & Refunds' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  const fill = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      router.push(user.role === 'admin' ? '/admin' : '/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-[800px] flex rounded-lg shadow-card-hover overflow-hidden">

        {/* ── Left panel — brand ────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-b from-primary to-primary-dark
                        text-white p-10 w-[44%] flex-shrink-0">
          <div>
            {/* Logo */}
            <div className="mb-8">
              <span className="text-3xl font-extrabold tracking-tight">
                Shop<span className="text-accent">Kart</span>
              </span>
              <span className="block text-gray-400 text-xs italic mt-0.5">
                Explore <span className="text-accent">Plus</span> ✦
              </span>
            </div>

            <h2 className="text-2xl font-bold leading-snug">
              Log in & access
              <br />
              your account
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              India's favourite online marketplace
            </p>

            {/* Benefits */}
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

          {/* Bottom illustration */}
          <div className="text-6xl select-none text-center opacity-30 mt-10">🛒</div>
        </div>

        {/* ── Right panel — form ────────────────────────────────────────────── */}
        <div className="flex-1 bg-white p-8 sm:p-10">

          {/* Mobile logo */}
          <div className="md:hidden mb-6 text-center">
            <span className="text-2xl font-extrabold text-primary">
              Shop<span className="text-accent">Kart</span>
            </span>
          </div>

          <h1 className="text-xl font-semibold text-gray-800 mb-1">Login</h1>
          <p className="text-muted text-sm mb-6">
            Get access to your Orders, Wishlist and more
          </p>

          {/* Demo accounts */}
          <div className="mb-5">
            <p className="text-xs text-muted font-medium mb-2 uppercase tracking-wide">
              Quick fill (demo)
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => fill(a.email, a.password)}
                  className={`border text-xs font-medium px-3 py-1 rounded-full
                              transition-all hover:scale-105 active:scale-95 ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm
                            rounded px-4 py-3 flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
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
              <div className="flex justify-end mt-1">
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-muted leading-relaxed">
              By continuing, you agree to ShopKart's{' '}
              <span className="text-primary cursor-pointer hover:underline">Terms of Use</span>
              {' '}and{' '}
              <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full btn-primary flex items-center justify-center gap-2
                         disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Logging in…
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-muted">New to ShopKart?</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <Link
            href="/register"
            className="block w-full text-center border border-accent text-accent text-sm
                       font-semibold py-2.5 rounded hover:bg-accent-light transition-colors"
          >
            Create an Account
          </Link>

          {/* Filled credentials preview */}
          {email && (
            <p className="mt-4 text-center text-xs text-muted">
              Logging in as <span className="font-medium text-gray-700">{email}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
