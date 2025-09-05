import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ربات ترید حرفه‌ای',
  description: 'ربات معاملاتی خودکار برای صرافی‌های ایرانی با استراتژی EMA+RSI',
  keywords: 'ربات ترید، معاملات خودکار، صرافی ایرانی، نوبیتکس، EMA، RSI',
  authors: [{ name: 'Professional Trading Bot' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}