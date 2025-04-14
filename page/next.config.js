/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用图像优化
  images: {
    domains: [], // 添加你需要的外部图片域名
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // 启用静态压缩
  compress: true,
  // 启用生产环境源码映射，方便调试
  productionBrowserSourceMaps: false,
  // 启用增量静态再生成
  experimental: {
    scrollRestoration: true,
  },
  // 优化打包设置
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 配置CDN前缀（如有）
  // assetPrefix: 'https://your-cdn.com',
  // 静态页面缓存
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig 