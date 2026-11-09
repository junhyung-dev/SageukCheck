"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollText, ArrowUpRight } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const isVerifyPage = pathname?.startsWith("/verify");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-hanji/95 backdrop-blur-sm no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 focus:outline-none"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-cinnabar/40 bg-cinnabar/10 font-serif text-xs font-bold text-cinnabar transition-colors group-hover:bg-cinnabar group-hover:text-white"
          >
            史
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold tracking-tight text-ink">
              史劇Check
            </span>
            <span className="hidden text-xs font-medium text-ink-muted sm:inline-block">
              사극체크 · 역사 고증 검수소
            </span>
          </div>
        </Link>

        {/* Right: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium text-ink-muted">
          <Link
            href="/#about"
            className="px-2.5 py-1.5 rounded-sm transition-colors hover:text-ink hover:bg-hanji-dark/60"
          >
            서비스 소개
          </Link>
          <span className="text-border select-none" aria-hidden="true">
            |
          </span>
          <Link
            href="/verify"
            className={`px-2.5 py-1.5 rounded-sm transition-colors ${
              isVerifyPage
                ? "text-pine font-semibold bg-pine-light/70"
                : "hover:text-ink hover:bg-hanji-dark/60"
            }`}
          >
            고증 검수
          </Link>
          <span className="text-border select-none" aria-hidden="true">
            |
          </span>
          <Link
            href="/#how-it-works"
            className="px-2.5 py-1.5 rounded-sm transition-colors hover:text-ink hover:bg-hanji-dark/60"
          >
            사용 방법
          </Link>

          {!isVerifyPage && (
            <Link
              href="/verify"
              className="ml-2 hidden md:inline-flex items-center gap-1.5 rounded-sm bg-pine px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-pine-hover"
            >
              <ScrollText className="h-3.5 w-3.5" />
              <span>검수 시작</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
