/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { hostname: 'cdn.tailgrids.com' },
      { hostname: 'placeimg.com' },
      { hostname: 'dummyimage.com' },
    ],
  },
}

module.exports = nextConfig
