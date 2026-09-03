import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow local and network dev origins
  allowedDevOrigins: ['10.101.73.162', 'localhost:3000', '127.0.0.1:3000'],
  // Image optimization configuration
  images: {
    // Allow images from these external domains (add more as needed)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
