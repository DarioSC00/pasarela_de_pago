import type { Metadata } from 'next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'FormaPro — Panel de Pagos',
  description: 'Dashboard inteligente de pagos con análisis en tiempo real, conversión de divisas y reportes automatizados.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <ToastContainer position="bottom-right" theme="dark" toastStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
      </body>
    </html>
  );
}
