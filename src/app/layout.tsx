import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "금요찬양 검색 · 화양교회",
  description:
    "화양교회 금요성령집회 찬양, 이 곡 마지막으로 언제 했는지 찾아주는 도구",
  applicationName: "금요찬양 검색",
  // 내부용 도구 — 검색엔진 노출 차단
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "금요찬양 검색 · 화양교회",
    description: "이 찬양 마지막으로 언제 했지? 금요성령집회 콘티 검색",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafaf9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-stone-50">
        <Nav />
        {children}
      </body>
    </html>
  );
}
