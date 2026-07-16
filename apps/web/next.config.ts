import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    const apiPort = process.env.API_PORT || '5000';
    return [
      {
        source: '/api/:path*',
        destination: `http://127.0.0.1:${apiPort}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `http://127.0.0.1:${apiPort}/socket.io/`,
      },
    ];
  },
};

export default nextConfig;
