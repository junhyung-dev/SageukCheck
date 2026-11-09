import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "史劇Check (사극체크) — AI 사극 역사 고증 검수 서비스",
  description:
    "사극 대본과 역사 사료를 대조하여 역사적 사실의 일치 여부를 검증하는 AI 기반 역사 고증 검수 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Noto+Serif+KR:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-hanji text-ink font-sans selection:bg-pine/15 selection:text-pine">
        {children}
      </body>
    </html>
  );
}
