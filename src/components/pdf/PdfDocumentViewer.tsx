"use client";

import React, { useEffect, useRef, useState } from "react";
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

interface PdfDocumentViewerProps {
  file: File | null;
}

type ViewMode = "single" | "all";

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

function PdfPageCanvas({
  pdfDoc,
  pageNumber,
  scale,
}: {
  pdfDoc: PDFDocumentProxyLike;
  pageNumber: number;
  scale: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  return (
    <div className="relative inline-block rounded-sm border border-border bg-white shadow-archive my-2">
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <Loader2 className="h-5 w-5 animate-spin text-pine" />
        </div>
      )}
      <canvas ref={canvasRef} className="block max-w-full h-auto" />
      <div className="border-t border-border bg-hanji/60 px-3 py-1 text-right font-mono text-[11px] text-ink-muted">
        Page {pageNumber}
      </div>
    </div>
  );
}

export function PdfDocumentViewer({ file }: PdfDocumentViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxyLike | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.05);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [useNativeFallback, setUseNativeFallback] = useState<boolean>(false);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);

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

  if (!file) {
    return (
      <div className="flex h-96 items-center justify-center rounded-sm border border-border bg-hanji-card p-6 text-sm text-ink-muted">
        표시할 원본 PDF 문서가 없습니다.
      </div>
    );
  }

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
            <span className="rounded-sm bg-hanji-card px-2 py-0.5 font-mono text-[11px] text-ink-muted border border-border">
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
                  title="이전 페이지"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 font-mono text-[11px] font-semibold">
                  {currentPage} / {numPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(numPages, p + 1))
                  }
                  className="p-1 text-ink hover:text-pine disabled:opacity-40"
                  title="다음 페이지"
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
                title="축소"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px]">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setScale((s) => Math.min(2.2, Number((s + 0.15).toFixed(2))))
                }
                className="p-1 text-ink hover:text-pine"
                title="확대"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setScale(1.05)}
                className="p-1 text-ink-muted hover:text-ink border-l border-border ml-0.5"
                title="기본 배율로 초기화"
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
              <span>{viewMode === "all" ? "단일 페이지" : "전체 페이지"}</span>
            </button>
          </div>
        )}

        {/* Switch to native browser viewer option */}
        {objectUrl && (
          <button
            type="button"
            onClick={() => setUseNativeFallback((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-hanji-card px-2 py-1 text-[11px] text-ink-muted hover:text-ink"
            title="브라우저 기본 PDF 뷰어 전환"
          >
            <Maximize2 className="h-3 w-3" />
            <span>{useNativeFallback ? "캔버스 뷰어" : "기본 뷰어"}</span>
          </button>
        )}
      </div>

      {/* Quick Page Thumbnail Jump Bar when in Single mode */}
      {!useNativeFallback && numPages > 1 && viewMode === "single" && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border bg-hanji/40 px-4 py-2 text-xs">
          <span className="text-[11px] font-medium text-ink-muted shrink-0 mr-1">
            페이지 바로가기:
          </span>
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`h-6 min-w-[26px] rounded-sm px-1.5 font-mono text-[11px] font-semibold transition-colors ${
                currentPage === pageNum
                  ? "bg-pine text-white"
                  : "bg-hanji-card text-ink-muted border border-border hover:border-pine"
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}

      {/* Main Document Viewport */}
      <div className="relative h-[740px] w-full overflow-auto bg-hanji-dark/60 p-4 text-center">
        {loadingPdf ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-ink-muted">
            <Loader2 className="h-6 w-6 animate-spin text-pine" />
            <span>원본 PDF 문서를 불러오는 중입니다...</span>
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
