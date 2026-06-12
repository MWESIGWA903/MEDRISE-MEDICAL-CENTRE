import React from 'react';

import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { WhatsAppButton } from './WhatsAppButton';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
