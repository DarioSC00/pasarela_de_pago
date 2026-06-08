import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SuperBase Dashboard',
  description: 'Dashboard de pagos con Supabase y exportación CSV',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
