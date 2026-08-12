import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'ShopKart — Online Shopping India',
  description: 'India\'s #1 online marketplace — Electronics, Fashion, Home & more',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
