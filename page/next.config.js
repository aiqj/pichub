/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用图像优化
  images: {
    domains: [], // 添加你需要的外部图片域名
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    unoptimized: true, // 对静态导出必须设置为true
  },
  // 启用静态压缩
  compress: true,
  // 禁用生产环境源码映射，减小打包体积
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
  // 使用export输出模式，生成完全静态的站点
  output: 'export',
  // 静态页面缓存
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // 禁用严格模式以避免一些Cloudflare Pages兼容性问题
  reactStrictMode: false,
}

module.exports = nextConfig
