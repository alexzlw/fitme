import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitMe - 云端减脂记录看板",
  description: "生活化减脂记录助手，记录每天的摄入、蛋白质和缺口，自动同步到 Supabase。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
