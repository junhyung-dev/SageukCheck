"use client";

import React from "react";
import { JobStatus } from "@/types/verification";
import {
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  Layers,
  XCircle,
  RotateCcw,
} from "lucide-react";

interface AnalysisProgressPanelProps {
  status: JobStatus;
  fileName: string;
  jobId: string | null;
  elapsedSeconds: number;
  errorMessage: string | null;
  onRetry: () => void;
  onCancelOrReset: () => void;
}

export function AnalysisProgressPanel({
  status,
  fileName,
  jobId,
  elapsedSeconds,
  errorMessage,
  onRetry,
  onCancelOrReset,
}: AnalysisProgressPanelProps) {
  const getStatusHeadline = () => {
    switch (status) {
      case "uploading":
        return "Upstage Files API로 문서를 업로드하는 중입니다...";
      case "queued":
        return "Upstage Studio 워크플로우 실행 대기 중(queued)...";
      case "in_progress":
        return "AI 역사 고증 워크플로우 분석 진행 중(in_progress)...";
      case "completed":
        return "고증 검수 분석이 완료되었습니다.";
      case "failed":
        return "분석 처리 중 오류가 발생했습니다.";
    }
  };

  const getStatusSubtext = () => {
    switch (status) {
      case "uploading":
        return "업로드한 PDF 원본의 무결성을 검증하고 안전한 세션 스토리지로 전송하고 있습니다.";
      case "queued":
        return "문서 업로드가 완료되어 Upstage Studio Agent 작업 큐에 등록되었습니다. 곧 분석이 시작됩니다.";
      case "in_progress":
        return "Studio에 구성된 파이프라인(문서 분석 · 역사적 근거 대조 · 고증 결과 생성)이 실시간 실행되고 있습니다.";
      case "completed":
        return "판정 결과 및 사료 출처 정규화를 마쳤습니다.";
      case "failed":
        return (
          errorMessage ||
          "Upstage API 통신 또는 워크플로우 처리 중 문제가 발생했습니다."
        );
    }
  };

  // Real API states: uploading -> queued -> in_progress -> completed
  const isUploaded =
    status === "queued" || status === "in_progress" || status === "completed";
  const isWorkflowRunning = status === "queued" || status === "in_progress";
  const isDone = status === "completed";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="archive-corner-frame rounded-sm border border-border bg-hanji-card p-6 sm:p-10 shadow-archive-md">
        {/* Header badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm bg-pine text-white font-serif text-xs font-bold">
              史
            </span>
            <span className="text-xs font-semibold text-pine">
              Upstage Studio Agent 실시간 고증 검수
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-muted">
            {jobId && (
              <span className="font-mono text-[11px] bg-hanji px-2.5 py-1 rounded-sm border border-border">
                Job: {jobId.slice(0, 18)}...
              </span>
            )}
            <span className="inline-flex items-center gap-1 font-mono">
              <Clock className="h-3.5 w-3.5 text-pine" />
              {elapsedSeconds}초 경과
            </span>
          </div>
        </div>

        {/* Center Status Indicator */}
        <div className="py-8 text-center space-y-4">
          {status === "failed" ? (
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cinnabar-light text-cinnabar border border-cinnabar/30">
              <XCircle className="h-7 w-7" />
            </div>
          ) : (
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine-light text-pine border border-pine/25">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-sm bg-hanji px-3 py-1 text-xs font-medium text-ink-muted border border-border">
              <FileText className="h-3.5 w-3.5 text-pine" />
              <span>대상 문서: {fileName}</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-ink sm:text-2xl pt-2">
              {getStatusHeadline()}
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-sm leading-relaxed text-ink-muted">
              {getStatusSubtext()}
            </p>
          </div>
        </div>

        {/* Real API Status Bar (업로드 중 -> 분석 대기 -> 분석 진행 중 -> 완료) */}
        <div className="mt-2 rounded-sm border border-border bg-hanji/60 p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-ink-muted mb-3">
            <span>실제 API 작업 상태 (Upstage Responses API)</span>
            <span className="font-mono uppercase text-pine">
              STATUS: {status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div
              className={`rounded-sm border p-3 text-xs ${
                status === "uploading"
                  ? "border-pine bg-pine-light/60 font-bold text-pine"
                  : isUploaded
                  ? "border-border bg-hanji-card text-ink"
                  : "border-border bg-hanji/40 text-ink-light"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>1. 업로드 중</span>
                {isUploaded ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-pine" />
                ) : status === "uploading" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-pine" />
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-ink-muted font-normal">
                POST /v2/files
              </p>
            </div>

            <div
              className={`rounded-sm border p-3 text-xs ${
                status === "queued"
                  ? "border-pine bg-pine-light/60 font-bold text-pine"
                  : status === "in_progress" || isDone
                  ? "border-border bg-hanji-card text-ink"
                  : "border-border bg-hanji/40 text-ink-light"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>2. 분석 대기</span>
                {status === "in_progress" || isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-pine" />
                ) : status === "queued" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-pine" />
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-ink-muted font-normal">
                status: queued
              </p>
            </div>

            <div
              className={`rounded-sm border p-3 text-xs ${
                status === "in_progress"
                  ? "border-pine bg-pine-light/60 font-bold text-pine"
                  : isDone
                  ? "border-border bg-hanji-card text-ink"
                  : "border-border bg-hanji/40 text-ink-light"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>3. 분석 진행 중</span>
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-pine" />
                ) : status === "in_progress" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-pine" />
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-ink-muted font-normal">
                status: in_progress
              </p>
            </div>

            <div
              className={`rounded-sm border p-3 text-xs ${
                isDone
                  ? "border-pine bg-pine-light/60 font-bold text-pine"
                  : "border-border bg-hanji/40 text-ink-light"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>4. 완료</span>
                {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-pine" />}
              </div>
              <p className="mt-1 text-[11px] text-ink-muted font-normal">
                status: completed
              </p>
            </div>
          </div>
        </div>

        {/* Four Conceptual Workflow Stages Display (without faking individual node completion) */}
        <div className="mt-6 rounded-sm border border-border bg-hanji-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Layers className="h-4 w-4 text-pine" />
              <span>워크플로우 처리 단계 안내</span>
            </div>
            <span className="text-[11px] text-ink-muted">
              ※ Upstage API는 전체 Job 단위 상태를 반환하며, 아래 파이프라인이 일괄 실행됩니다.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {/* Stage 1: 문서 업로드 */}
            <div
              className={`rounded-sm border p-3.5 ${
                isUploaded
                  ? "border-pine/40 bg-pine-light/25"
                  : status === "uploading"
                  ? "border-pine bg-pine-light/40"
                  : "border-border bg-hanji/30"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>문서 업로드</span>
                {isUploaded ? (
                  <span className="text-[11px] font-semibold text-pine">
                    완료
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-pine">
                    진행 중
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                PDF 원본 전송 및 File ID 발급
              </p>
            </div>

            {/* Stage 2: 문서 분석 */}
            <div
              className={`rounded-sm border p-3.5 ${
                isDone
                  ? "border-pine/40 bg-pine-light/25"
                  : isWorkflowRunning
                  ? "border-pine/60 bg-hanji"
                  : "border-border bg-hanji/30"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>문서 분석</span>
                <span className="text-[11px] text-ink-muted">
                  {isDone ? "완료" : isWorkflowRunning ? "워크플로우 실행 중" : "대기"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                Parse · Classify 노드로 대본과 사료 분리 인식
              </p>
            </div>

            {/* Stage 3: 역사적 근거 대조 */}
            <div
              className={`rounded-sm border p-3.5 ${
                isDone
                  ? "border-pine/40 bg-pine-light/25"
                  : isWorkflowRunning
                  ? "border-pine/60 bg-hanji"
                  : "border-border bg-hanji/30"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>역사적 근거 대조</span>
                <span className="text-[11px] text-ink-muted">
                  {isDone ? "완료" : isWorkflowRunning ? "워크플로우 실행 중" : "대기"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                Extract · Merge 노드로 대본 주장과 실록 기록 비교
              </p>
            </div>

            {/* Stage 4: 고증 결과 생성 */}
            <div
              className={`rounded-sm border p-3.5 ${
                isDone
                  ? "border-pine/40 bg-pine-light/25"
                  : isWorkflowRunning
                  ? "border-pine/60 bg-hanji"
                  : "border-border bg-hanji/30"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>고증 결과 생성</span>
                <span className="text-[11px] text-ink-muted">
                  {isDone ? "완료" : isWorkflowRunning ? "워크플로우 실행 중" : "대기"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                Instruct 노드로 일치·충돌·검토 필요 판정 산출
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions (Retry on error or Cancel) */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <p className="text-xs text-ink-muted">
            문서 분량 및 스캔 이미지 포함 여부에 따라 약 15초~60초가 소요될 수 있습니다.
          </p>

          <div className="flex items-center gap-2.5">
            {status === "failed" && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-sm bg-pine px-4 py-2 text-xs font-semibold text-white hover:bg-pine-hover"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>다시 시도</span>
              </button>
            )}
            <button
              type="button"
              onClick={onCancelOrReset}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-hanji-card px-4 py-2 text-xs font-medium text-ink hover:bg-hanji-dark"
            >
              <span>다른 문서 선택</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
