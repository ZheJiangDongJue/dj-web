import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.3.*'],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false, // 非永久，便于后续调整与缓存行为
      },
    ]
  },
};

export default nextConfig;
