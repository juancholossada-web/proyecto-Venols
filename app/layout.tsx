import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VENOLS ERP — Logística Marítima',
  description: 'Sistema ERP para gestión logística marítima',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">{children}</body>
    </html>
  )
}
