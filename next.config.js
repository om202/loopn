/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disable React Strict Mode to test double-effect issue
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Optimize images for better caching and performance
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [16, 32, 48, 64, 96, 128],
    imageSizes: [16, 32, 48, 64, 96, 128],
    // Cache optimized images for 1 year
    minimumCacheTTL: 31536000,
  },
  async rewrites() {
    return [
      // Short chat URLs: /c/abc123 -> /chat/6d3b1cf9-a279-46d0-a446-fd338ae11351
      {
        source: '/c/:shortId',
        destination: '/chat/:shortId',
      },
    ];
  },
};

module.exports = nextConfig;
