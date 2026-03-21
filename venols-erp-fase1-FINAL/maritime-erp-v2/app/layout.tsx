import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VENOLS ERP — Logística Marítima',
  description: 'Sistema ERP para gestión logística marítima',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
