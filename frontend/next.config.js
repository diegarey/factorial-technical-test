/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suprimir advertencias de hidratación causadas por extensiones como Grammarly
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Ignorar errores específicos de hidratación
  experimental: {
    // Suprimir advertencias relacionadas con atributos extra durante la hidratación
    suppressHydrationWarning: true,
  },
  // Configuración para imágenes
  images: {
    domains: ['images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      }
    ],
  }
}

module.exports = nextConfig 