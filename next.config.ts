import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.3.*'],
  experimental: {
    // 在部分受限环境（例如某些 Windows 沙箱）中，Node 子进程 IPC（stdio: 'ipc'）会触发 spawn EPERM。
    // Next.js 构建阶段的 TypeScript 校验默认使用 jest-worker 子进程模型；启用 workerThreads 后会改用 worker_threads，
    // 从而避免子进程 IPC，确保 `next build` 可正常执行。
    workerThreads: true,
  },
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
