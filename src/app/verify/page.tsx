"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PdfUploadPanel } from "@/components/upload/PdfUploadPanel";
import { AnalysisProgressPanel } from "@/components/analysis/AnalysisProgressPanel";
import { VerificationResultCard } from "@/components/results/VerificationResultCard";
import {
  CitationFocus,
  PdfDocumentViewer,
} from "@/components/pdf/PdfDocumentViewer";
import { SAMPLE_DATASETS, sampleUploadName } from "@/lib/sample-datasets";
import {
  CreateVerifyApiResponse,
  JobStatus,
  PollJobApiResponse,
  VerificationCitation,
  VerificationResult,
} from "@/types/verification";
import { ArrowLeft, BookOpen, FileText } from "lucide-react";

type ViewStep = "upload" | "analyzing" | "result";

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_TIME_SECONDS = 300; // 5 minutes timeout guard

function VerifyWorkspaceContent() {
  const searchParams = useSearchParams();
  const sampleParam = searchParams.get("sample");

  const [viewStep, setViewStep] = useState<ViewStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>("uploading");
  const [jobId, setJobId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<unknown>(null);
  const [citationFocus, setCitationFocus] = useState<CitationFocus | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  const handleCitationSelect = useCallback((citation: VerificationCitation) => {
    setCitationFocus((prev) => ({ citation, nonce: (prev?.nonce ?? 0) + 1 }));
    // Below the desktop breakpoint the viewer sits above the report: bring it into view.
    if (window.innerWidth < 1024) {
      viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Preload sample dataset if ?sample=set01..set18 is in the URL
  useEffect(() => {
    if (!sampleParam) return;
    const matched = SAMPLE_DATASETS.find(
      (s) => s.id.toLowerCase() === sampleParam.toLowerCase()
    );
    if (!matched) return;

    let cancelled = false;
    async function loadSampleFromQuery() {
      try {
        const res = await fetch(matched!.filename);
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;
        const file = new File([blob], sampleUploadName(matched!), {
          type: "application/pdf",
        });
        setSelectedFile(file);
      } catch {
        // Ignore
      }
    }
    loadSampleFromQuery();

    return () => {
      cancelled = true;
    };
  }, [sampleParam]);

  const startPollingJob = useCallback(
    (activeJobId: string, activeFileId: string) => {
      const startTime = Date.now();

      elapsedTimerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(secs);
        if (secs > MAX_POLL_TIME_SECONDS) {
          clearTimers();
          setJobStatus("failed");
          setErrorMessage(
            "워크플로우 분석 응답 대기 시간이 초과되었습니다(5분). 네트워크 또는 Upstage Studio 상태를 확인 후 다시 시도해 주세요."
          );
        }
      }, 1000);

      const pollOnce = async () => {
        try {
          const query = activeFileId
            ? `?fileId=${encodeURIComponent(activeFileId)}`
            : "";
          const res = await fetch(
            `/api/jobs/${encodeURIComponent(activeJobId)}${query}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const data = (await res.json()) as PollJobApiResponse & {
            error?: string;
          };

          if (!res.ok) {
            clearTimers();
            setJobStatus("failed");
            setErrorMessage(
              data.error ||
                `작업 상태 조회 중 오류가 발생했습니다 (HTTP ${res.status}).`
            );
            return;
          }

          if (data.status === "failed") {
            clearTimers();
            setJobStatus("failed");
            setErrorMessage(
              data.error ||
                "Upstage Studio 워크플로우 작업이 실패(failed) 상태로 종료되었습니다."
            );
            return;
          }

          if (data.status === "completed") {
            clearTimers();
            if (!data.result) {
              setJobStatus("failed");
              setErrorMessage(
                "분석은 완료되었으나 결과 데이터를 생성하지 못했습니다."
              );
              return;
            }
            setJobStatus("completed");
            setVerificationResult(data.result);
            setRawApiResponse(data.rawResponse ?? null);
            setViewStep("result");
            return;
          }

          // queued or in_progress
          setJobStatus(data.status);
        } catch (err) {
          // Network hiccup during polling: surface if persistent
          setErrorMessage(
            `상태 조회 중 일시적인 통신 오류가 발생했습니다: ${(err as Error).message}`
          );
        }
      };

      // Trigger first check after 1.5s, then every POLL_INTERVAL_MS
      pollTimerRef.current = setInterval(pollOnce, POLL_INTERVAL_MS);
    },
    [clearTimers]
  );

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      setErrorMessage("먼저 업로드할 PDF 파일을 선택해 주세요.");
      return;
    }

    clearTimers();
    setErrorMessage(null);
    setVerificationResult(null);
    setRawApiResponse(null);
    setCitationFocus(null);
    setElapsedSeconds(0);
    setJobId(null);
    setFileId(null);
    setJobStatus("uploading");
    setViewStep("analyzing");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as CreateVerifyApiResponse & {
        error?: string;
      };

      if (!response.ok || !data.jobId) {
        setJobStatus("failed");
        setErrorMessage(
          data.error ||
            `문서 업로드 및 분석 요청에 실패했습니다 (상태 코드: ${response.status}).`
        );
        return;
      }

      setJobId(data.jobId);
      setFileId(data.fileId);
      setJobStatus(data.status === "in_progress" ? "in_progress" : "queued");

      startPollingJob(data.jobId, data.fileId);
    } catch (err) {
      setJobStatus("failed");
      setErrorMessage(
        (err as Error).message ||
          "서버와 통신하는 중 오류가 발생했습니다. 네트워크 연결을 확인해 주세요."
      );
    }
  };

  const handleResetToUpload = () => {
    clearTimers();
    setViewStep("upload");
    setJobStatus("uploading");
    setJobId(null);
    setFileId(null);
    setErrorMessage(null);
    setVerificationResult(null);
    setRawApiResponse(null);
    setCitationFocus(null);
  };

  return (
    <main className="flex-1 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Sub-navigation bar when in Analyzing or Result step */}
        {viewStep !== "upload" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 no-print">
            <button
              type="button"
              onClick={handleResetToUpload}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>문서 다시 선택하기</span>
            </button>

            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <FileText className="h-3.5 w-3.5 text-pine" />
                {selectedFile?.name}
              </span>
              {jobId && (
                <span className="hidden sm:inline-block font-mono text-[11px] text-ink-light">
                  Job ID: {jobId}
                </span>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: PDF Upload View */}
        {viewStep === "upload" && (
          <PdfUploadPanel
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onStartAnalysis={handleStartAnalysis}
            isSubmitting={false}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
          />
        )}

        {/* STEP 2: Analysis Progress View */}
        {viewStep === "analyzing" && (
          <AnalysisProgressPanel
            status={jobStatus}
            fileName={selectedFile?.name || "document.pdf"}
            jobId={jobId}
            elapsedSeconds={elapsedSeconds}
            errorMessage={errorMessage}
            onRetry={handleStartAnalysis}
            onCancelOrReset={handleResetToUpload}
          />
        )}

        {/* STEP 3: Verification Result View (2-Column Desktop Split Layout) */}
        {viewStep === "result" && verificationResult && (
          <div className="space-y-6">
            {/* Top Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-sm border border-border bg-hanji-card px-5 py-3.5 shadow-archive no-print">
              <div className="flex items-center gap-2 text-xs text-ink">
                <BookOpen className="h-4 w-4 text-pine shrink-0" />
                <span className="font-semibold">
                  원본 문서와 고증 검수 보고서 대조
                </span>
              </div>
              <span className="text-xs text-ink-muted">
                {verificationResult.documentSegments && verificationResult.documentSegments.length > 0
                  ? "뷰어의 쪽 번호는 워크플로우가 나눈 문서별로 묶여 있습니다. 근거의 쪽 표시를 누르면 해당 위치로 이동합니다."
                  : "왼쪽 뷰어에서 원문을 넘겨보며 오른쪽 판정 근거를 확인하세요."}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              {/* Left Column: Original PDF Document Viewer */}
              <div ref={viewerRef} className="lg:col-span-6 lg:sticky lg:top-20 scroll-mt-20 no-print">
                <PdfDocumentViewer
                  file={selectedFile}
                  segments={verificationResult.documentSegments}
                  focus={citationFocus}
                />
              </div>

              {/* Right Column: AI Historical Verification Report */}
              <div className="lg:col-span-6 print-full-width">
                <VerificationResultCard
                  result={verificationResult}
                  rawResponse={rawApiResponse}
                  fileName={selectedFile?.name || "document.pdf"}
                  onReset={handleResetToUpload}
                  onCitationSelect={handleCitationSelect}
                  activeCitationIndex={citationFocus?.citation.index ?? null}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-hanji text-ink">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-12 text-sm text-ink-muted">
            고증 검수 화면을 준비하는 중입니다...
          </div>
        }
      >
        <VerifyWorkspaceContent />
      </Suspense>
      <Footer />
    </div>
  );
}
