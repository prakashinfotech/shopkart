'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MapPin, Phone, User, Loader2, ShoppingBag,
  ChevronRight, CreditCard, Truck, Smartphone,
  Landmark, Wallet, Eye, EyeOff, ChevronDown,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}

function fmtCard(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ');
}

function fmtExpiry(val: string) {
  const d = val.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// ── Static data ───────────────────────────────────────────────────────────────

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda',
  'Canara Bank', 'IndusInd Bank', 'YES Bank', 'Union Bank of India',
  'IDFC First Bank', 'Federal Bank', 'South Indian Bank',
];

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentType  = 'cod' | 'online';
type OnlineMethod = 'upi' | 'netbanking' | 'credit_card' | 'debit_card';

interface FormState {
  fullName:     string;
  phone:        string;
  street:       string;
  city:         string;
  state:        string;
  pincode:      string;
  paymentType:  PaymentType;
  onlineMethod: OnlineMethod | '';
  // UPI
  upiId:        string;
  // Card (shared for credit & debit)
  cardName:     string;
  cardNumber:   string;
  cardExpiry:   string;
  cardCvv:      string;
  // Net banking
  bank:         string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CartItem = any;

// ── Online-method config ──────────────────────────────────────────────────────

const ONLINE_METHODS: {
  id: OnlineMethod;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { id: 'upi',         label: 'UPI',         subtitle: 'Pay via any UPI app',           icon: Smartphone, color: 'text-green-600'  },
  { id: 'netbanking',  label: 'Net Banking',  subtitle: 'All major banks supported',     icon: Landmark,   color: 'text-blue-600'   },
  { id: 'credit_card', label: 'Credit Card',  subtitle: 'Visa, Mastercard, RuPay, Amex', icon: CreditCard, color: 'text-purple-600' },
  { id: 'debit_card',  label: 'Debit Card',   subtitle: 'All major bank debit cards',    icon: Wallet,     color: 'text-orange-600' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router    = useRouter();
  const { user }  = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { items = [], cartTotal, clearCart } = (useCart() as any) ?? {};

  const [form, setForm] = useState<FormState>({
    fullName:     '',
    phone:        '',
    street:       '',
    city:         '',
    state:        '',
    pincode:      '',
    paymentType:  'cod',
    onlineMethod: '',
    upiId:        '',
    cardName:     '',
    cardNumber:   '',
    cardExpiry:   '',
    cardCvv:      '',
    bank:         '',
  });

  const [errors,     setErrors]     = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState('');
  const [showCvv,    setShowCvv]    = useState(false);

  // Pre-fill name
  useEffect(() => {
    if (user) setForm(f => ({ ...f, fullName: f.fullName || user.name }));
  }, [user]);

  useEffect(() => {
    if (!user) router.replace('/login?returnTo=/checkout');
  }, [user, router]);

  useEffect(() => {
    if (Array.isArray(items) && items.length === 0) router.replace('/cart');
  }, [items, router]);

  const mrpTotal = items.reduce((s: number, i: CartItem) => s + ((i.mrp ?? i.price) * i.quantity), 0);
  const discount = mrpTotal - cartTotal;

  // ── Field setter ──────────────────────────────────────────────────────────

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
    setApiError('');
  }

  // Switch top-level payment type and clear online sub-state
  function setPaymentType(type: PaymentType) {
    setForm(f => ({
      ...f,
      paymentType:  type,
      onlineMethod: '',
      upiId:        '',
      cardName:     '',
      cardNumber:   '',
      cardExpiry:   '',
      cardCvv:      '',
      bank:         '',
    }));
    setErrors({});
    setApiError('');
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: FormErrors = {};

    if (!form.fullName.trim())               e.fullName = 'Full name is required';
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone    = 'Enter a valid 10-digit number';
    if (!form.street.trim())                 e.street   = 'Street / area is required';
    if (!form.city.trim())                   e.city     = 'City is required';
    if (!form.state)                         e.state    = 'Please select a state';
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit pincode';

    if (form.paymentType === 'online') {
      if (!form.onlineMethod) {
        e.onlineMethod = 'Please select an online payment method';
      } else if (form.onlineMethod === 'upi') {
        if (!form.upiId.trim())
          e.upiId = 'UPI ID is required';
        else if (!/^[\w.\-_]{3,}@[a-z]{2,}$/.test(form.upiId.trim()))
          e.upiId = 'Enter a valid UPI ID (e.g. name@upi)';
      } else if (form.onlineMethod === 'netbanking') {
        if (!form.bank) e.bank = 'Please select your bank';
      } else if (form.onlineMethod === 'credit_card' || form.onlineMethod === 'debit_card') {
        if (!form.cardName.trim())                       e.cardName   = 'Name on card is required';
        if (form.cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = 'Enter a valid 16-digit card number';
        if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry))    e.cardExpiry = 'Enter expiry as MM/YY';
        if (!/^\d{3,4}$/.test(form.cardCvv))            e.cardCvv   = 'Enter valid CVV (3–4 digits)';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    setApiError('');

    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/orders/place', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddress: {
            fullName: form.fullName.trim(),
            phone:    form.phone.trim(),
            street:   form.street.trim(),
            city:     form.city.trim(),
            state:    form.state,
            pincode:  form.pincode.trim(),
          },
          paymentMethod:       form.paymentType,
          onlinePaymentMethod: form.onlineMethod || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setApiError(data.message || 'Failed to place order.'); return; }

      clearCart?.();
      router.push(`/orders/${data.order._id}`);
    } catch {
      setApiError('Network error — please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading guard ─────────────────────────────────────────────────────────

  if (!user || !items.length) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  const isOnline = form.paymentType === 'online';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-surface py-4">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-4">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-500 mb-4">
            <span>Cart</span>
            <ChevronRight size={12} />
            <span className="text-primary font-semibold">Delivery Address</span>
            <ChevronRight size={12} />
            <span className={isOnline ? 'text-primary font-semibold' : ''}>Payment</span>
          </nav>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col lg:flex-row gap-4 items-start">

              {/* ── Left column ──────────────────────────────────── */}
              <div className="flex-1 space-y-4">

                {/* API error */}
                {apiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm
                                  rounded px-4 py-3 flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0">⚠</span>
                    <span>{apiError}</span>
                  </div>
                )}

                {/* ── Delivery Address ─────────────────────────── */}
                <div className="bg-white rounded shadow-card p-5">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
                    <MapPin size={16} className="text-primary" />
                    Delivery Address
                  </h2>

                  <div className="space-y-4">
                    {/* Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Full Name *" error={errors.fullName}>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={form.fullName}
                            onChange={e => set('fullName', e.target.value)}
                            placeholder="Enter full name"
                            className={inp(!!errors.fullName) + ' pl-9'}
                          />
                        </div>
                      </Field>

                      <Field label="Phone Number *" error={errors.phone}>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit mobile number"
                            className={inp(!!errors.phone) + ' pl-9'}
                          />
                        </div>
                      </Field>
                    </div>

                    {/* Street */}
                    <Field label="Street / Area / Colony *" error={errors.street}>
                      <textarea
                        rows={2}
                        value={form.street}
                        onChange={e => set('street', e.target.value)}
                        placeholder="House no., building name, street, area"
                        className={inp(!!errors.street) + ' resize-none'}
                      />
                    </Field>

                    {/* City + State + Pincode */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="City *" error={errors.city}>
                        <input
                          type="text"
                          value={form.city}
                          onChange={e => set('city', e.target.value)}
                          placeholder="City"
                          className={inp(!!errors.city)}
                        />
                      </Field>

                      <Field label="State *" error={errors.state}>
                        <select
                          value={form.state}
                          onChange={e => set('state', e.target.value)}
                          className={inp(!!errors.state) + ' bg-white ' + (!form.state ? 'text-gray-400' : 'text-gray-800')}
                        >
                          <option value="">Select state</option>
                          {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>

                      <Field label="Pincode *" error={errors.pincode}>
                        <input
                          type="text"
                          value={form.pincode}
                          onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="6-digit pincode"
                          className={inp(!!errors.pincode)}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* ── Payment Method ───────────────────────────── */}
                <div className="bg-white rounded shadow-card p-5">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
                    <CreditCard size={16} className="text-primary" />
                    Payment Method
                  </h2>

                  <div className="space-y-3">

                    {/* ─ Cash on Delivery ─ */}
                    <button
                      type="button"
                      onClick={() => setPaymentType('cod')}
                      className={`w-full flex items-center gap-3 p-4 border rounded-xl text-left
                                  transition-all duration-200
                                  ${form.paymentType === 'cod'
                                    ? 'border-primary bg-primary/10 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                                       ${form.paymentType === 'cod' ? 'border-primary' : 'border-gray-400'}`}>
                        {form.paymentType === 'cod' && (
                          <span className="w-2 h-2 rounded-full bg-primary block" />
                        )}
                      </span>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                                      ${form.paymentType === 'cod' ? 'bg-primary/10' : 'bg-gray-100'}`}>
                        <Truck size={18} className={form.paymentType === 'cod' ? 'text-primary' : 'text-gray-500'} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Cash on Delivery</p>
                        <p className="text-xs text-gray-500 mt-0.5">Pay when your order arrives at your door</p>
                      </div>
                      {form.paymentType === 'cod' && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10
                                         px-2 py-0.5 rounded-full flex-shrink-0">
                          SELECTED
                        </span>
                      )}
                    </button>

                    {/* ─ Online Payment ─ */}
                    <div className={`border rounded-xl transition-all duration-200 overflow-hidden
                                    ${isOnline
                                      ? 'border-primary shadow-sm'
                                      : 'border-gray-200 hover:border-gray-300'}`}>

                      {/* Header row */}
                      <button
                        type="button"
                        onClick={() => setPaymentType('online')}
                        className={`w-full flex items-center gap-3 p-4 text-left transition-colors
                                    ${isOnline ? 'bg-primary/10' : 'hover:bg-gray-50'}`}
                      >
                        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                                         ${isOnline ? 'border-primary' : 'border-gray-400'}`}>
                          {isOnline && <span className="w-2 h-2 rounded-full bg-primary block" />}
                        </span>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                                        ${isOnline ? 'bg-primary/10' : 'bg-gray-100'}`}>
                          <CreditCard size={18} className={isOnline ? 'text-primary' : 'text-gray-500'} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">Online Payment</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isOnline && form.onlineMethod
                              ? ONLINE_METHODS.find(m => m.id === form.onlineMethod)?.label
                              : 'UPI · Net Banking · Credit / Debit Card'}
                          </p>
                        </div>
                        {isOnline && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10
                                           px-2 py-0.5 rounded-full flex-shrink-0">
                            SELECTED
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 flex-shrink-0 transition-transform duration-300
                                      ${isOnline ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* ── Expandable sub-section ── */}
                      <div className={`transition-all duration-300 ease-in-out
                                      ${isOnline ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'}
                                      overflow-hidden`}>
                        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-primary/10 bg-primary/5">

                          {/* Method-selection error */}
                          {errors.onlineMethod && (
                            <p className="text-xs text-red-500 font-medium">{errors.onlineMethod}</p>
                          )}

                          {/* Sub-method radio tiles */}
                          <div className="grid grid-cols-2 gap-2">
                            {ONLINE_METHODS.map(m => {
                              const Icon      = m.icon;
                              const selected  = form.onlineMethod === m.id;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => set('onlineMethod', m.id)}
                                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left
                                              transition-all duration-150
                                              ${selected
                                                ? 'border-primary bg-white shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                                  ${selected ? 'bg-primary/10' : 'bg-gray-50'}`}>
                                    <Icon size={16} className={selected ? 'text-primary' : m.color} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-xs font-semibold truncate
                                                   ${selected ? 'text-primary' : 'text-gray-800'}`}>
                                      {m.label}
                                    </p>
                                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{m.subtitle}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* ── UPI fields ── */}
                          {form.onlineMethod === 'upi' && (
                            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3
                                            animate-fade-in">
                              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                <Smartphone size={13} className="text-green-600" />
                                Enter UPI ID
                              </p>
                              <Field label="" error={errors.upiId}>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={form.upiId}
                                    onChange={e => set('upiId', e.target.value.toLowerCase())}
                                    placeholder="yourname@upi  (e.g. raj@paytm)"
                                    className={inp(!!errors.upiId)}
                                  />
                                </div>
                              </Field>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {['@paytm','@gpay','@oksbi','@ybl','@ibl'].map(suffix => (
                                  <button
                                    key={suffix}
                                    type="button"
                                    onClick={() => set('upiId', form.upiId.split('@')[0] + suffix)}
                                    className="text-[10px] text-primary border border-primary/30 px-2 py-0.5
                                               rounded-full hover:bg-primary/5 transition-colors"
                                  >
                                    {suffix}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ── Net Banking ── */}
                          {form.onlineMethod === 'netbanking' && (
                            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3
                                            animate-fade-in">
                              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                <Landmark size={13} className="text-blue-600" />
                                Select Your Bank
                              </p>
                              <Field label="" error={errors.bank}>
                                <select
                                  value={form.bank}
                                  onChange={e => set('bank', e.target.value)}
                                  className={inp(!!errors.bank) + ' bg-white ' + (!form.bank ? 'text-gray-400' : 'text-gray-800')}
                                >
                                  <option value="">-- Choose bank --</option>
                                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                              </Field>
                              {form.bank && (
                                <p className="text-xs text-green-600 font-medium">
                                  ✓ You will be redirected to {form.bank}&apos;s secure portal
                                </p>
                              )}
                            </div>
                          )}

                          {/* ── Credit / Debit Card ── */}
                          {(form.onlineMethod === 'credit_card' || form.onlineMethod === 'debit_card') && (
                            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3
                                            animate-fade-in">
                              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                {form.onlineMethod === 'credit_card'
                                  ? <CreditCard size={13} className="text-purple-600" />
                                  : <Wallet    size={13} className="text-orange-600" />}
                                {form.onlineMethod === 'credit_card' ? 'Credit' : 'Debit'} Card Details
                              </p>

                              {/* Card name */}
                              <Field label="Name on Card" error={errors.cardName}>
                                <input
                                  type="text"
                                  value={form.cardName}
                                  onChange={e => set('cardName', e.target.value.toUpperCase())}
                                  placeholder="As printed on card"
                                  className={inp(!!errors.cardName)}
                                  autoComplete="cc-name"
                                />
                              </Field>

                              {/* Card number — visual card strip */}
                              <Field label="Card Number" error={errors.cardNumber}>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={form.cardNumber}
                                    onChange={e => set('cardNumber', fmtCard(e.target.value))}
                                    placeholder="0000 0000 0000 0000"
                                    maxLength={19}
                                    className={inp(!!errors.cardNumber) + ' font-mono tracking-widest pr-14'}
                                    autoComplete="cc-number"
                                  />
                                  {/* Card network hint */}
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2
                                                   text-[10px] font-bold text-gray-400 tracking-wide">
                                    {form.cardNumber.startsWith('4') ? 'VISA'
                                      : form.cardNumber.startsWith('5') ? 'MC'
                                      : form.cardNumber.startsWith('6') ? 'RUPAY'
                                      : form.cardNumber.startsWith('3') ? 'AMEX'
                                      : 'CARD'}
                                  </span>
                                </div>
                              </Field>

                              {/* Expiry + CVV */}
                              <div className="grid grid-cols-2 gap-3">
                                <Field label="Expiry (MM/YY)" error={errors.cardExpiry}>
                                  <input
                                    type="text"
                                    value={form.cardExpiry}
                                    onChange={e => set('cardExpiry', fmtExpiry(e.target.value))}
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    className={inp(!!errors.cardExpiry) + ' font-mono'}
                                    autoComplete="cc-exp"
                                  />
                                </Field>

                                <Field label="CVV" error={errors.cardCvv}>
                                  <div className="relative">
                                    <input
                                      type={showCvv ? 'text' : 'password'}
                                      value={form.cardCvv}
                                      onChange={e => set('cardCvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                      placeholder="•••"
                                      maxLength={4}
                                      className={inp(!!errors.cardCvv) + ' font-mono pr-10'}
                                      autoComplete="cc-csc"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowCvv(v => !v)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2
                                                 text-gray-400 hover:text-gray-600"
                                    >
                                      {showCvv ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                  </div>
                                </Field>
                              </div>

                              <p className="text-[10px] text-gray-400 leading-relaxed">
                                🔒 Your card details are encrypted and never stored on our servers.
                              </p>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* ── Right column: order summary ──────────────────── */}
              <div className="lg:w-80 w-full flex-shrink-0">
                <div className="bg-white rounded shadow-card p-5 sticky top-20 space-y-4">

                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Order Summary ({items.length} item{items.length !== 1 ? 's' : ''})
                  </h3>

                  {/* Items */}
                  <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                    {items.map((item: CartItem) => (
                      <div key={item.productId} className="flex items-center gap-3">
                        <div className="relative w-10 h-10 flex-shrink-0 bg-gray-50 rounded
                                        border border-gray-100 overflow-hidden">
                          <Image
                            src={item.image || 'https://picsum.photos/seed/order-item/40/40'}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 truncate font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-800 flex-shrink-0">
                          {fmt(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Price breakdown */}
                  <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>MRP Total</span><span>{fmt(mrpTotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Discount</span><span>− {fmt(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span className="text-green-600 font-medium">FREE</span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-gray-900
                                    pt-2 border-t border-dashed border-gray-200 mt-2">
                      <span>Total</span><span>{fmt(cartTotal)}</span>
                    </div>
                    {discount > 0 && (
                      <p className="text-green-600 text-xs font-medium">
                        You save {fmt(discount)} on this order 🎉
                      </p>
                    )}
                  </div>

                  {/* Payment summary chip */}
                  {form.paymentType && (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      {form.paymentType === 'cod'
                        ? <Truck size={14} className="text-primary" />
                        : <CreditCard size={14} className="text-primary" />}
                      <span className="text-xs text-gray-700">
                        {form.paymentType === 'cod'
                          ? 'Cash on Delivery'
                          : form.onlineMethod
                            ? ONLINE_METHODS.find(m => m.id === form.onlineMethod)?.label ?? 'Online'
                            : 'Online Payment'}
                      </span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary flex items-center justify-center gap-2
                               disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Placing Order…
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={15} />
                        Place Order · {fmt(cartTotal)}
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                    By placing your order you agree to our Terms of Use and Privacy Policy
                  </p>
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Shared form-field wrapper ─────────────────────────────────────────────────

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      )}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// Shared input class builder
function inp(hasError: boolean) {
  return `w-full px-3 py-2.5 text-sm border rounded outline-none
          focus:border-primary focus:ring-2 focus:ring-primary/20
          transition-all placeholder:text-gray-400
          ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;
}
