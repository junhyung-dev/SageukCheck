"use client";

import React, { useRef, useState } from "react";
import { SAMPLE_DATASETS, sampleUploadName } from "@/lib/sample-datasets";
import { SampleCaseList } from "@/components/samples/SampleCaseList";
import { SampleDataset } from "@/types/verification";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Play,
  RefreshCw,
  FolderOpen,
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
        "PDF 파일만 올릴 수 있어요."
      );
      return;
    }

    if (file.size === 0) {
      setLocalValidationError(
        "빈 파일이에요. 다른 PDF를 골라 주세요."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalValidationError(
        `파일이 500MB를 넘어요(${formatFileSize(file.size)}). 더 작은 PDF를 골라 주세요.`
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
        "PDF는 한 번에 하나만 올릴 수 있어요. 대본과 사료를 한 파일로 묶어 주세요."
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
        throw new Error("샘플 PDF를 불러오지 못했어요. 다시 눌러 주세요.");
      }
      const blob = await res.blob();
      const file = new File([blob], sampleUploadName(sample), {
        type: "application/pdf",
      });
      onSelectFile(file);
    } catch (err) {
      setLocalValidationError(
        (err as Error).message || "샘플 PDF를 불러오지 못했어요. 다시 눌러 주세요."
      );
    } finally {
      setLoadingSampleId(null);
    }
  };

  const activeError = localValidationError || errorMessage;

  return (
    <div className="mx-auto max-w-5xl space-y-8 break-keep">
      {/* Main Upload Card */}
      <div className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 sm:p-10 shadow-archive-md">
        <div className="border-b border-border pb-6">
          <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
            검수할 PDF를 올려 주세요.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            대본과 사료를 PDF 하나로 묶어 주세요. 검토 요청서가 있으면 같이 넣어도 돼요.
          </p>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div
            role="alert"
            className="mt-6 flex items-start justify-between gap-3 rounded-sm border border-cinnabar/40 bg-cinnabar-light p-4 text-sm text-cinnabar"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="leading-relaxed text-ink">{activeError}</p>
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
                PDF를 여기에 끌어다 놓으세요
              </p>
              <p className="mt-1.5 text-xs text-ink-muted">500MB까지 올릴 수 있어요.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-2 rounded-sm border border-border-strong bg-hanji-card px-5 py-2.5 text-xs font-semibold text-ink shadow-archive transition-colors hover:bg-hanji-dark"
                >
                  <FolderOpen className="h-4 w-4 text-pine" aria-hidden="true" />
                  <span>파일 고르기</span>
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
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        준비됐어요
                      </span>
                      <span className="text-xs text-ink-muted">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                    <p className="mt-1 font-serif text-base font-bold text-ink break-all">
                      {selectedFile.name}
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
                    <span>다른 파일</span>
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
        <div className="mt-8 flex flex-col sm:flex-row sm:justify-end border-t border-border pt-6">

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (!selectedFile) {
                setLocalValidationError(
                  "PDF를 먼저 올리거나 아래 샘플을 골라 주세요."
                );
                return;
              }
              onStartAnalysis();
            }}
            className="inline-flex items-center justify-center gap-2.5 rounded-sm bg-pine px-7 py-4 text-sm font-semibold text-white shadow-archive transition-all hover:bg-pine-hover disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            <span>판정 시작</span>
          </button>
        </div>
      </div>

      {/* Final dataset cases (set01 ~ set18), grouped by expected decision */}
      <div className="rounded-sm border border-border bg-hanji-card p-6 sm:p-8 shadow-archive">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-lg font-bold text-ink">
            샘플로 해 보기
          </h2>
          <p className="text-xs text-ink-muted">
            탭 이름은 미리 정해 둔 정답이에요. 누르면 위 칸에 들어가요.
          </p>
        </div>

        <div className="mt-6">
          <SampleCaseList
            mode="select"
            selectedId={
              SAMPLE_DATASETS.find((s) => selectedFile?.name === sampleUploadName(s))?.id ?? null
            }
            loadingId={loadingSampleId}
            disabled={isSubmitting}
            onSelect={handleLoadSample}
          />
        </div>
      </div>
    </div>
  );
}
