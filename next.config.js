/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'staticd.profootballnetwork.com',
      'wallpapers.com',
      '1000logos.net',
      'upload.wikimedia.org'
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  transpilePackages: ['firebase', '@firebase/database'],
};

module.exports = nextConfig;