import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/theme/ThemeProvider";
import DensityClient from "@/components/responsive/DensityClient";
import ThemeInitScript from "@/components/theme/ThemeInitScript";
import { Toaster } from "@/components/ui/sonner";
import AppServicesProvider from "@/infrastructure/di/AppServicesProvider";
import { RouteTransitionProvider } from "@/components/transition/RouteTransitionContext";
import { TopProgressBar } from "@/components/transition/TopProgressBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "东爵线缆",
  description: "东爵线缆聚合应用平台",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 *
 * 应用根布局（RootLayout）。
 * @remarks 在此处挂载全局主题、密度与 DI Provider。
 *
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        {/* 在任何应用 JS 执行前设置主题与密度，避免闪白 */}
        <ThemeInitScript />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}>
        <ThemeProvider>
          <RouteTransitionProvider>
            <TopProgressBar />
            <AppServicesProvider>
              <DensityClient />
              {/* 全局提示容器（sonner） */}
              <Toaster position="top-center" richColors closeButton />
              {children}
            </AppServicesProvider>
          </RouteTransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
