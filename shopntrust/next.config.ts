import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
