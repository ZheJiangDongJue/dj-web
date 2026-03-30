import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
