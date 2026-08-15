import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ciclic — Calculador y Gestor Inteligente de Costos de Software',
  description: 'Plataforma para estimación de costos, presupuestación modular y control de flujo de caja para proyectos Web y Mobile.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
