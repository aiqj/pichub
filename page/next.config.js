/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tailwindcss/postcss'],
  webpack: (config) => {
    return config;
  }
}

module.exports = nextConfig 