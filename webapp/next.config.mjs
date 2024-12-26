/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  webpack: (config) => {
    return config;
  },
  env: {
    PORT: 3000,
  },
};

export default nextConfig;
