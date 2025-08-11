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
