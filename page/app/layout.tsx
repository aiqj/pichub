import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles.css"; // 导入直接编写的CSS文件

// 使用SF Pro和Inter字体
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PicHub - 高科技图像云存储平台",
  description: "下一代智能图像存储与分享平台",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} bg-dark min-h-screen antialiased overflow-x-hidden`} suppressHydrationWarning>
        {/* 星空背景 */}
        <div className="stars">
          <div className="small"></div>
          <div className="medium"></div>
          <div className="big"></div>
        </div>
        
        {/* 主要内容 */}
        {children}
      </body>
    </html>
  );
}