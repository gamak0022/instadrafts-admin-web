import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Instadraft Admin Control',
  description: 'Internal orchestration portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}