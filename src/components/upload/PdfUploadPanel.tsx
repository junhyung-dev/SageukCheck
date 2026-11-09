"use client";

import React, { useRef, useState } from "react";
import { SAMPLE_DATASETS } from "@/lib/sample-datasets";
import { SampleDataset } from "@/types/verification";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Play,
  RefreshCw,
  FolderOpen,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface PdfUploadPanelProps {
  selectedFile: File | null;
  onSelectFile: (file: File | null) => void;
  onStartAnalysis: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClearError: () => void;
}

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function PdfUploadPanel({
  selectedFile,
  onSelectFile,
  onStartAnalysis,
  isSubmitting,
  errorMessage,
  onClearError,
}: PdfUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localValidationError, setLocalValidationError] = useState<string | null>(
    null
  );
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);

  const validateAndSetFile = (file: File | null) => {
    setLocalValidationError(null);
    onClearError();

    if (!file) {
      onSelectFile(null);
      return;
    }

    const isPdfMime = file.type === "application/pdf";
    const isPdfExt = file.name.toLowerCase().endsWith(".pdf");

    if (!isPdfMime && !isPdfExt) {
      setLocalValidationError(
        `지원하지 않는 파일 형식입니다(${file.name}). PDF 형식(.pdf)의 문서만 업로드할 수 있습니다.`
      );
      return;
    }

    if (file.size === 0) {
      setLocalValidationError(
        "파일 크기가 0B입니다. 정상적인 PDF 문서를 업로드해 주세요."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalValidationError(
        `파일 크기가 허용 한도(500MB)를 초과했습니다(${formatFileSize(file.size)}).`
      );
      return;
    }

    onSelectFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      validateAndSetFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    if (droppedFiles.length > 1) {
      setLocalValidationError(
        "현재 워크플로우는 대본과 역사 사료가 하나로 결합된 단일 PDF 파일 업로드를 지원합니다. 파일 1개만 선택해 주세요."
      );
      return;
    }

    validateAndSetFile(droppedFiles[0]);
  };

  const handleLoadSample = async (sample: SampleDataset) => {
    try {
      setLoadingSampleId(sample.id);
      setLocalValidationError(null);
      onClearError();

      const res = await fetch(sample.filename);
      if (!res.ok) {
        throw new Error("샘플 PDF 파일을 불러오지 못했습니다.");
      }
      const blob = await res.blob();
      const file = new File(
        [blob],
        `${sample.id}_${sample.code}_백성의글자.pdf`,
        { type: "application/pdf" }
      );
      onSelectFile(file);
    } catch (err) {
      setLocalValidationError(
        (err as Error).message || "샘플 파일을 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setLoadingSampleId(null);
    }
  };

  const activeError = localValidationError || errorMessage;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Main Upload Card */}
      <div className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 sm:p-10 shadow-archive-md">
        <div className="border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-pine mb-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-pine text-white font-serif text-[11px]">
              檢
            </span>
            <span>AI 역사 고증 문서 업로드</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
            검토할 사극 대본과 역사 사료를 업로드하세요.
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            사극 대본과 대조할 역사 사료(조선왕조실록 기사, 고증 검토 요청서 등)가 하나로 결합된 PDF 문서를 업로드하면 Upstage Studio 워크플로우가 즉시 실행됩니다.
          </p>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div
            role="alert"
            className="mt-6 flex items-start justify-between gap-3 rounded-sm border border-cinnabar/40 bg-cinnabar-light p-4 text-sm text-cinnabar"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">문서 검증 또는 요청 오류</p>
                <p className="text-xs leading-relaxed text-ink">{activeError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLocalValidationError(null);
                onClearError();
              }}
              className="rounded-sm p-1 text-cinnabar hover:bg-cinnabar/10"
              aria-label="오류 메시지 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div className="mt-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-sm border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
                isDragging
                  ? "border-pine bg-pine-light/50"
                  : "border-border-strong bg-hanji/50 hover:border-pine/70 hover:bg-hanji"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-hanji-card text-pine shadow-archive">
                <Upload className="h-6 w-6" />
              </div>
              <p className="mt-4 font-serif text-base font-bold text-ink sm:text-lg">
                PDF 문서를 이곳에 끌어다 놓거나 클릭하여 선택하세요
              </p>
              <p className="mt-1.5 text-xs text-ink-muted">
                지원 형식: PDF (.pdf) · 최대 파일 크기: 500MB · 최대 1,000페이지
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-2 rounded-sm border border-border-strong bg-hanji-card px-5 py-2.5 text-xs font-semibold text-ink shadow-archive transition-colors hover:bg-hanji-dark"
                >
                  <FolderOpen className="h-4 w-4 text-pine" />
                  <span>컴퓨터에서 PDF 파일 선택</span>
                </button>
              </div>
            </div>
          ) : (
            /* Selected File Preview Box */
            <div className="rounded-sm border border-pine/40 bg-pine-light/30 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-pine text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-sm bg-pine/10 px-2 py-0.5 text-[11px] font-semibold text-pine">
                        <CheckCircle2 className="h-3 w-3" />
                        업로드 준비 완료
                      </span>
                      <span className="text-xs text-ink-muted">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                    <p className="mt-1 font-serif text-base font-bold text-ink break-all">
                      {selectedFile.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      문서 형식: PDF 문서 · 대본 및 역사 사료 통합 검수 대상
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-hanji-card px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-hanji-dark disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>파일 교체</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => validateAndSetFile(null)}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-cinnabar/30 bg-hanji-card px-3.5 py-2 text-xs font-medium text-cinnabar transition-colors hover:bg-cinnabar-light disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>삭제</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border pt-6">
          <div className="text-xs text-ink-muted space-y-0.5">
            <p className="font-medium text-ink">
              Upstage Studio 워크플로우 연동 안내
            </p>
            <p>
              버튼을 누르면 PDF가 Upstage Files API로 업로드된 후 Agent 워크플로우가 실시간 실행됩니다.
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (!selectedFile) {
                setLocalValidationError(
                  "먼저 검토할 사극 대본 및 역사 사료 PDF 파일을 업로드하거나 아래 테스트 문서를 선택해 주세요."
                );
                return;
              }
              onStartAnalysis();
            }}
            className="inline-flex items-center justify-center gap-2.5 rounded-sm bg-pine px-7 py-4 text-sm font-semibold text-white shadow-archive transition-all hover:bg-pine-hover disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>AI 역사 고증 분석 시작</span>
          </button>
        </div>
      </div>

      {/* Test Cases (set01 ~ set05) Quick Load Section */}
      <div className="rounded-sm border border-border bg-hanji-card p-6 sm:p-8 shadow-archive">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-pine">
              <Sparkles className="h-3.5 w-3.5" />
              <span>해커톤 공식 검증 데이터셋 (set01 ~ set05)</span>
            </div>
            <h2 className="mt-1 font-serif text-lg font-bold text-ink">
              사전 준비된 테스트 케이스로 즉시 검증하기
            </h2>
          </div>
          <span className="text-xs text-ink-muted">
            클릭 시 해당 실제 PDF 파일이 업로드 영역에 로드됩니다
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SAMPLE_DATASETS.map((sample) => {
            const isSelected =
              selectedFile?.name.startsWith(`${sample.id}_${sample.code}`) ??
              false;
            const isLoadingThis = loadingSampleId === sample.id;

            return (
              <button
                key={sample.id}
                type="button"
                disabled={isSubmitting || isLoadingThis}
                onClick={() => handleLoadSample(sample)}
                className={`text-left flex flex-col justify-between rounded-sm border p-3.5 transition-all ${
                  isSelected
                    ? "border-pine bg-pine-light/50 ring-1 ring-pine"
                    : "border-border bg-hanji/40 hover:border-pine/60 hover:bg-hanji"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-pine">
                      {sample.id.toUpperCase()} · {sample.code}
                    </span>
                    <span className="text-[11px] text-ink-light">
                      {sample.pages}p
                    </span>
                  </div>
                  <p className="mt-1.5 font-serif text-xs font-bold text-ink line-clamp-1">
                    {sample.episode}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-muted line-clamp-2">
                    {sample.expectedPoint}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-border/70 text-[11px] font-semibold text-pine">
                  {isLoadingThis
                    ? "PDF 불러오는 중..."
                    : isSelected
                    ? "✓ 현재 선택됨"
                    : "이 문서 선택하기 →"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
