/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL", // Alternatively use "SAMEORIGIN" if you only want Farcaster to embed it
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *" // For modern browsers
          }
        ],
      },
    ];
  },
};

export default nextConfig;
