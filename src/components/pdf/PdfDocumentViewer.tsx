"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Layers,
  Maximize2,
  Loader2,
} from "lucide-react";
import { DocumentSegment, VerificationCitation } from "@/types/verification";

/** A citation the user asked to see; `nonce` re-triggers focus on repeat clicks. */
export type CitationFocus = { citation: VerificationCitation; nonce: number };

interface PdfDocumentViewerProps {
  file: File | null;
  /** Classify result: which pages the workflow read as which document. */
  segments?: DocumentSegment[];
  focus?: CitationFocus | null;
}

type ViewMode = "single" | "all";

/** Display names for the Classify categories of the 최종_사극체크 workflow. */
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  script: "대본",
  source_record: "사료",
  source_digest: "사료 (정리)",
  source_form_unknown: "사료 (판독 확인)",
  review_request: "요청서",
};

interface PDFPageProxyLike {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void>; cancel?: () => void };
}

interface PDFDocumentProxyLike {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxyLike>;
}

type PageGroup = { label: string; pages: number[]; classified: boolean };

/** Groups consecutive pages that Classify assigned to the same document type. */
function groupPages(numPages: number, segments: DocumentSegment[]): PageGroup[] {
  const labelOf = (page: number): string | null => {
    for (const seg of segments) {
      if (seg.pageRanges.some(([from, to]) => page >= from && page <= to)) {
        return DOCUMENT_TYPE_LABELS[seg.documentType] ?? seg.documentType;
      }
    }
    return null;
  };

  const groups: PageGroup[] = [];
  for (let page = 1; page <= numPages; page++) {
    const label = labelOf(page);
    const key = label ?? "분류 안 됨";
    const last = groups[groups.length - 1];
    if (last && last.label === key) {
      last.pages.push(page);
    } else {
      groups.push({ label: key, pages: [page], classified: label !== null });
    }
  }
  return groups;
}

/** Bounding box of a normalized polygon, as CSS percentages with a small pad. */
function boxStyle(citation: VerificationCitation): React.CSSProperties | null {
  const pts = citation.coordinates;
  if (pts.length === 0) return null;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const pad = 0.006;
  const left = Math.max(0, Math.min(...xs) - pad);
  const top = Math.max(0, Math.min(...ys) - pad);
  const right = Math.min(1, Math.max(...xs) + pad);
  const bottom = Math.min(1, Math.max(...ys) + pad);
  return {
    left: `${left * 100}%`,
    top: `${top * 100}%`,
    width: `${(right - left) * 100}%`,
    height: `${(bottom - top) * 100}%`,
  };
}

function PdfPageCanvas({
  pdfDoc,
  pageNumber,
  scale,
  highlight,
  onHighlightReady,
}: {
  pdfDoc: PDFDocumentProxyLike;
  pageNumber: number;
  scale: number;
  highlight?: CitationFocus | null;
  onHighlightReady?: (el: HTMLElement) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const markRef = useRef<HTMLDivElement | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    let renderTask: { promise: Promise<void>; cancel?: () => void } | null =
      null;

    async function renderPage() {
      if (!canvasRef.current || !pdfDoc) return;
      try {
        setRendering(true);
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });
        const displayViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${displayViewport.width}px`;
        canvas.style.height = `${displayViewport.height}px`;

        renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;
        if (!isCancelled) {
          setRendering(false);
        }
      } catch {
        // Ignore cancelled renders
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask?.cancel) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  const box = highlight ? boxStyle(highlight.citation) : null;

  useEffect(() => {
    if (!rendering && box && markRef.current && onHighlightReady) {
      onHighlightReady(markRef.current);
    }
    // Re-run only when a new focus arrives or the page finishes rendering.
  }, [rendering, highlight?.nonce, scale]); // eslint-disable-line

  return (
    <div className="relative inline-block rounded-sm border border-border bg-white shadow-archive my-2">
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <Loader2 className="h-5 w-5 animate-spin text-pine" />
        </div>
      )}
      <div className="relative">
        <canvas ref={canvasRef} className="block max-w-full h-auto" />
        {box && highlight && (
          <div
            key={highlight.nonce}
            ref={markRef}
            style={box}
            className="evidence-mark pointer-events-none absolute border-2 border-ink bg-ink/[0.06]"
            aria-hidden
          >
            <span className="absolute -left-0.5 bottom-full mb-0.5 whitespace-nowrap bg-ink px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
              근거 {highlight.citation.index}
            </span>
          </div>
        )}
      </div>
      <div className="border-t border-border bg-hanji/60 px-3 py-1 text-right text-[11px] tabular-nums text-ink-muted">
        {pageNumber}쪽
      </div>
    </div>
  );
}

export function PdfDocumentViewer({ file, segments, focus }: PdfDocumentViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxyLike | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.05);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [useNativeFallback, setUseNativeFallback] = useState<boolean>(false);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      setPdfDoc(null);
      setNumPages(0);
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setCurrentPage(1);
    setUseNativeFallback(false);

    let cancelled = false;

    async function loadPdfDocument() {
      try {
        setLoadingPdf(true);
        const arrayBuffer = await file!.arrayBuffer();
        if (cancelled) return;

        // Dynamically import pdfjs-dist on the client
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
        });

        const doc = (await loadingTask.promise) as unknown as PDFDocumentProxyLike;
        if (cancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch {
        if (!cancelled) {
          setUseNativeFallback(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingPdf(false);
        }
      }
    }

    loadPdfDocument();

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Jump to the cited page when the user picks a citation in the report.
  useEffect(() => {
    const page = focus?.citation.page;
    if (!focus || !page || page < 1 || (numPages > 0 && page > numPages)) return;
    setUseNativeFallback(false);
    setViewMode("single");
    setCurrentPage(page);
  }, [focus, numPages]);

  const pageGroups = useMemo(
    () => (segments && segments.length > 0 ? groupPages(numPages, segments) : null),
    [numPages, segments]
  );

  /** Scrolls the viewer (not the window) so the evidence box sits mid-view. */
  const scrollMarkIntoView = (el: HTMLElement) => {
    const container = viewportRef.current;
    if (!container) return;
    const c = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.scrollTo({
      top: container.scrollTop + (r.top - c.top) - c.height / 2 + r.height / 2,
      left: container.scrollLeft + (r.left - c.left) - c.width / 2 + r.width / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  if (!file) {
    return (
      <div className="flex h-96 items-center justify-center rounded-sm border border-border bg-hanji-card p-6 text-sm text-ink-muted">
        표시할 원본 PDF 문서가 없습니다.
      </div>
    );
  }

  const highlightFor = (pageNum: number) =>
    focus && focus.citation.page === pageNum ? focus : null;

  return (
    <div className="flex flex-col rounded-sm border border-border bg-hanji-card shadow-archive-md overflow-hidden no-print">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-hanji px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-pine shrink-0" />
          <span className="font-serif text-xs font-bold text-ink truncate max-w-[200px] sm:max-w-[260px]">
            {file.name}
          </span>
          {numPages > 0 && (
            <span className="rounded-sm bg-hanji-card px-2 py-0.5 text-[11px] tabular-nums text-ink-muted border border-border">
              총 {numPages}쪽
            </span>
          )}
        </div>

        {/* Controls */}
        {!useNativeFallback && numPages > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Page Navigation (Single Page Mode) */}
            {viewMode === "single" && (
              <div className="flex items-center rounded-sm border border-border bg-hanji-card px-1 py-0.5 text-xs">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 text-ink hover:text-pine disabled:opacity-40"
                  aria-label="이전 쪽"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 text-[11px] font-semibold tabular-nums">
                  {currentPage} / {numPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(numPages, p + 1))
                  }
                  className="p-1 text-ink hover:text-pine disabled:opacity-40"
                  aria-label="다음 쪽"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center rounded-sm border border-border bg-hanji-card px-1 py-0.5 text-xs">
              <button
                type="button"
                onClick={() =>
                  setScale((s) => Math.max(0.6, Number((s - 0.15).toFixed(2))))
                }
                className="p-1 text-ink hover:text-pine"
                aria-label="축소"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 text-[11px] tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setScale((s) => Math.min(2.2, Number((s + 0.15).toFixed(2))))
                }
                className="p-1 text-ink hover:text-pine"
                aria-label="확대"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setScale(1.05)}
                className="p-1 text-ink-muted hover:text-ink border-l border-border ml-0.5"
                aria-label="기본 배율로 되돌리기"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            {/* Toggle Single / All Pages */}
            <button
              type="button"
              onClick={() =>
                setViewMode((m) => (m === "single" ? "all" : "single"))
              }
              className={`inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                viewMode === "all"
                  ? "border-pine bg-pine text-white"
                  : "border-border bg-hanji-card text-ink hover:bg-hanji-dark"
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>{viewMode === "all" ? "한 쪽씩 보기" : "전체 쪽 보기"}</span>
            </button>
          </div>
        )}

        {/* Switch to native browser viewer option */}
        {objectUrl && (
          <button
            type="button"
            onClick={() => setUseNativeFallback((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-hanji-card px-2 py-1 text-[11px] text-ink-muted hover:text-ink"
            title="브라우저 기본 PDF 뷰어로 전환"
          >
            <Maximize2 className="h-3 w-3" />
            <span>{useNativeFallback ? "캔버스 뷰어" : "기본 뷰어"}</span>
          </button>
        )}
      </div>

      {/* Page jump bar: grouped by the documents the workflow found */}
      {!useNativeFallback && numPages > 1 && viewMode === "single" && (
        <nav
          aria-label="문서별 쪽 이동"
          className="flex items-center gap-x-4 gap-y-2 overflow-x-auto border-b border-border bg-hanji/40 px-4 py-2 text-xs"
        >
          {pageGroups ? (
            pageGroups.map((group, gi) => (
              <div key={`${group.label}-${gi}`} className="flex shrink-0 items-center gap-1.5">
                <span
                  className={`text-[11px] font-semibold ${
                    group.classified ? "text-ink" : "text-ink-light"
                  }`}
                >
                  {group.label}
                </span>
                {group.pages.map((pageNum) => (
                  <PageButton
                    key={pageNum}
                    pageNum={pageNum}
                    active={currentPage === pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                  />
                ))}
              </div>
            ))
          ) : (
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-[11px] font-medium text-ink-muted">쪽 이동</span>
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <PageButton
                  key={pageNum}
                  pageNum={pageNum}
                  active={currentPage === pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                />
              ))}
            </div>
          )}
        </nav>
      )}

      {/* Main Document Viewport */}
      <div
        ref={viewportRef}
        className="relative h-[740px] w-full overflow-auto bg-hanji-dark/60 p-4 text-center"
      >
        {loadingPdf ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-ink-muted">
            <Loader2 className="h-6 w-6 animate-spin text-pine" />
            <span>PDF를 불러오고 있어요</span>
          </div>
        ) : useNativeFallback && objectUrl ? (
          <iframe
            src={objectUrl}
            title="원본 PDF 문서 뷰어"
            className="h-full w-full rounded-sm border border-border bg-white"
          />
        ) : pdfDoc ? (
          viewMode === "single" ? (
            <PdfPageCanvas
              pdfDoc={pdfDoc}
              pageNumber={currentPage}
              scale={scale}
              highlight={highlightFor(currentPage)}
              onHighlightReady={scrollMarkIntoView}
            />
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {Array.from({ length: numPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PdfPageCanvas
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    scale={scale}
                    highlight={highlightFor(pageNum)}
                    onHighlightReady={scrollMarkIntoView}
                  />
                )
              )}
            </div>
          )
        ) : objectUrl ? (
          <iframe
            src={objectUrl}
            title="원본 PDF 문서 뷰어"
            className="h-full w-full rounded-sm border border-border bg-white"
          />
        ) : null}
      </div>
    </div>
  );
}

function PageButton({
  pageNum,
  active,
  onClick,
}: {
  pageNum: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={`${pageNum}쪽`}
      className={`h-6 min-w-[26px] rounded-sm px-1.5 text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pine ${
        active
          ? "bg-pine text-white"
          : "bg-hanji-card text-ink-muted border border-border hover:border-pine"
      }`}
    >
      {pageNum}
    </button>
  );
}
