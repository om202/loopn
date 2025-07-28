import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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

export default nextConfig;
