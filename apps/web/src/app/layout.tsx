import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AppToaster } from '@/components/ui/app-toaster';
import './globals.css';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VaultPay — Carteira Financeira',
  description: 'Depósito, transferência e reversão de transações com segurança',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${font.variable} dark`}>
      <body className="min-h-screen font-sans" suppressHydrationWarning>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
