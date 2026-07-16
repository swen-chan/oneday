import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "One Day 私域运营台 · 演示",
  description: "AI 私域运营平台演示（合成数据）",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
