/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
    return [{ source: '/api/:path*', destination: `${base}/api/:path*` }];
  },
};
module.exports = nextConfig;
