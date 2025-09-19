import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import './globals.css';
import { Navigation } from '../components/navigation';
import { ToastProvider } from '../components/toast-provider';
import { KeyboardShortcuts } from '../components/keyboard-shortcuts';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GameTok Operator Console',
  description: 'Monitor orchestration runs, blockers, and game experiments.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastProvider>
          <KeyboardShortcuts />
          <Navigation />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
