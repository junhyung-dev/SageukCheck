"use client";

import React from "react";
import { JobStatus } from "@/types/verification";
import { Check, Loader2, XCircle, RotateCcw } from "lucide-react";

interface AnalysisProgressPanelProps {
  status: JobStatus;
  elapsedSeconds: number;
  errorMessage: string | null;
  onRetry: () => void;
  onCancelOrReset: () => void;
}

const STEPS = ["PDF 올리기", "순서 기다리기", "대본과 사료 대조"] as const;

const STEP_INDEX: Record<JobStatus, number> = {
  uploading: 0,
  queued: 1,
  in_progress: 2,
  completed: STEPS.length,
  failed: -1,
};

const HEADLINE: Record<JobStatus, string> = {
  uploading: "PDF를 올리고 있어요",
  queued: "분석 순서를 기다리고 있어요",
  in_progress: "대본과 사료를 대조하고 있어요",
  completed: "판정이 끝났어요",
  failed: "결과를 받지 못했어요",
};

const SUBTEXT: Partial<Record<JobStatus, string>> = {
  queued: "업로드는 끝났어요. 곧 대조를 시작해요.",
  in_progress: "대본 속 역사 주장을 찾아 사료 기록과 맞춰 보는 중이에요.",
};

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;
}

export function AnalysisProgressPanel({
  status,
  elapsedSeconds,
  errorMessage,
  onRetry,
  onCancelOrReset,
}: AnalysisProgressPanelProps) {
  const isFailed = status === "failed";
  const activeIndex = STEP_INDEX[status];
  const subtext = isFailed
    ? errorMessage || "잠시 뒤 다시 시도해 주세요."
    : SUBTEXT[status];
  // 조회가 한 번 실패해도 작업은 계속 확인한다. 그동안 알림만 보여 준다.
  const connectionNote = !isFailed ? errorMessage : null;

  return (
    <div className="mx-auto max-w-2xl break-keep">
      <div className="rounded-sm border border-border bg-hanji-card p-6 shadow-archive-md sm:p-10">
        <div role="status" aria-live="polite" className="text-center">
          {isFailed ? (
            <XCircle className="mx-auto h-8 w-8 text-cinnabar" aria-hidden />
          ) : (
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-pine" aria-hidden />
          )}
          <h2 className="mt-4 font-serif text-xl font-bold text-ink sm:text-2xl">
            {HEADLINE[status]}
          </h2>
          {subtext && (
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
              {subtext}
            </p>
          )}
          {connectionNote && (
            <p className="mx-auto mt-3 max-w-md text-sm font-medium text-ink">{connectionNote}</p>
          )}
        </div>

        {!isFailed && (
          <ol className="mt-8 grid grid-cols-3 gap-2 border-t border-border pt-6">
            {STEPS.map((label, index) => {
              const done = index < activeIndex;
              const current = index === activeIndex;
              return (
                <li
                  key={label}
                  aria-current={current ? "step" : undefined}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                      done
                        ? "border-pine bg-pine text-white"
                        : current
                        ? "border-pine bg-pine-light text-pine"
                        : "border-border-strong bg-hanji-card text-ink-muted"
                    }`}
                    aria-hidden
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : current ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      current ? "font-semibold text-ink" : done ? "text-ink" : "text-ink-muted"
                    }`}
                  >
                    {label}
                    {done && <span className="sr-only"> (끝남)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {!isFailed ? (
          <p className="mt-6 text-center text-sm text-ink-muted">
            <span className="font-semibold tabular-nums text-ink">
              {formatElapsed(elapsedSeconds)}
            </span>{" "}
            지났어요. 짧으면 20초, 길면 5분쯤 걸려요.
          </p>
        ) : (
          <div className="mt-8 flex justify-center gap-2.5">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-sm bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine-hover"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              <span>다시 시도</span>
            </button>
            <button
              type="button"
              onClick={onCancelOrReset}
              className="inline-flex items-center rounded-sm border border-border-strong bg-hanji-card px-4 py-2 text-sm font-medium text-ink hover:bg-hanji-dark"
            >
              다른 문서 고르기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
