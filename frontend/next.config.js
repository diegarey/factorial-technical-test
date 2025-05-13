/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuración para imágenes
  images: {
    domains: ['localhost', '127.0.0.1', 'images.unsplash.com', 'randomuser.me'],
  },
  // Configuración para API
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig 