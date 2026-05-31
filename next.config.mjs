
/** @type {import('next').NextConfig} */

// Leer la versión desde package.json
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('./package.json');

const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
  env: {
    NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;
