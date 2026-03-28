import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaRegister from '@/components/PwaRegister'

export const metadata: Metadata = {
  title: 'VENOLS ERP — Logística Marítima',
  description: 'Sistema ERP para gestión logística marítima',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VENOLS ERP',
  },
  icons: {
    icon: '/favicon.png',
    apple: [
      { url: '/icon-152x152.png', sizes: '152x152' },
      { url: '/icon-180x180.png', sizes: '180x180' },
      { url: '/icon-192x192.png', sizes: '192x192' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#080E1A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-body">
        {children}
        <PwaRegister />
      </body>
    </html>
  )
}
