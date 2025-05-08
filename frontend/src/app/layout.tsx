import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Marcus Bikes - Bicicletas Personalizables',
  description: 'Tienda de bicicletas personalizables para Marcus',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Header />
        <main className="container mx-auto py-8 px-4">
          {children}
        </main>
        <footer className="bg-gray-100 py-6">
          <div className="container mx-auto px-4 text-center text-gray-600">
            &copy; {new Date().getFullYear()} Marcus Bikes. Todos los derechos reservados.
          </div>
        </footer>
      </body>
    </html>
  )
} 