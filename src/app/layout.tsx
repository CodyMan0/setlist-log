import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";
import Nav from "./nav";
import Splash from "../components/Splash";

// 브랜드(영문) 디스플레이 폰트. 본문은 globals.css 에서 Pretendard 사용.
const fraunces = Fraunces({
  variable: "--font-brand",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Conti Memory · 화양교회",
  description:
    "화양교회 금요예배·인터치 찬양 콘티, 이 곡 마지막으로 언제 했는지 찾아주는 도구",
  applicationName: "Conti Memory",
  // 내부용 도구 — 검색엔진 노출 차단
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: "Conti Memory · 화양교회",
    description: "이 찬양 마지막으로 언제 했지? 금요예배·인터치 콘티 검색",
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
    <html lang="ko" className={`${fraunces.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body className="flex min-h-full flex-col bg-stone-50">
        <Splash />
        <Nav />
        {children}
      </body>
    </html>
  );
}
