import Link from 'next/link';
import { CreditCard, Smartphone, ShieldCheck, Headphones } from 'lucide-react';

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const links = {
  'About': [
    { label: 'About Us',         href: '/about' },
    { label: 'Careers',          href: '/careers' },
    { label: 'Press',            href: '/press' },
    { label: 'Corporate Info',   href: '/corporate' },
  ],
  'Help': [
    { label: 'Payments',         href: '/help/payments' },
    { label: 'Shipping',         href: '/help/shipping' },
    { label: 'Cancellation & Returns', href: '/help/returns' },
    { label: 'FAQ',              href: '/help/faq' },
  ],
  'Policy': [
    { label: 'Return Policy',    href: '/policy/returns' },
    { label: 'Terms of Use',     href: '/policy/terms' },
    { label: 'Security',         href: '/policy/security' },
    { label: 'Privacy',          href: '/policy/privacy' },
  ],
  'Social': [
    { label: 'Seller Centre',    href: '/seller' },
    { label: 'Advertise',        href: '/advertise' },
    { label: 'Gift Cards',       href: '/giftcards' },
    { label: 'Contact Us',       href: '/contact' },
  ],
};

const trust = [
  { icon: ShieldCheck, label: '100% Secure Payments' },
  { icon: Smartphone,  label: 'Easy Mobile Checkout' },
  { icon: Headphones,  label: '24×7 Customer Support' },
  { icon: CreditCard,  label: 'EMI Available' },
];

const socials = [
  { icon: FacebookIcon,  href: '#', label: 'Facebook' },
  { icon: TwitterIcon,   href: '#', label: 'Twitter' },
  { icon: YoutubeIcon,   href: '#', label: 'YouTube' },
  { icon: InstagramIcon, href: '#', label: 'Instagram' },
];

const payIcons = ['Visa', 'Mastercard', 'UPI', 'NetBanking', 'COD', 'EMI'];

export default function Footer() {
  return (
    <footer className="bg-[#211d1a] text-gray-300 mt-6">
      {/* Trust bar */}
      <div className="border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 py-4
                        grid grid-cols-2 sm:grid-cols-4 gap-4">
          {trust.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5">
              <Icon size={18} className="text-accent flex-shrink-0" />
              <span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main links grid */}
      <div className="max-w-[1200px] mx-auto px-4 py-8
                      grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
        {Object.entries(links).map(([section, items]) => (
          <div key={section}>
            <h4 className="text-white text-xs font-semibold uppercase tracking-widest mb-3">
              {section}
            </h4>
            <ul className="space-y-2">
              {items.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 py-4
                        flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Brand + copyright */}
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">
              Shop<span className="text-accent">Kart</span>
            </span>
            <span className="text-gray-500 text-xs hidden sm:inline">|</span>
            <span className="text-gray-400 text-xs">
              © {new Date().getFullYear()} ShopKart Pvt Ltd.
            </span>
          </div>

          {/* Payment icons */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {payIcons.map((p) => (
              <span
                key={p}
                className="bg-white/10 text-white text-[9px] font-bold px-2 py-1
                           rounded border border-white/20"
              >
                {p}
              </span>
            ))}
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {socials.map(({ icon: Icon, href, label }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Icon />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
