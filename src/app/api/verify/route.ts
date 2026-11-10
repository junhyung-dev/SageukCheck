import { NextRequest, NextResponse } from "next/server";
import {
  createVerificationJob,
  uploadFileToUpstage,
  UpstageApiError,
} from "@/lib/upstage";

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB per Upstage spec

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          error: "PDF 파일이 오지 않았어요. 파일을 고른 뒤 다시 시도해 주세요.",
          code: "NO_FILE_UPLOADED",
        },
        { status: 400 }
      );
    }

    const fileName = file.name || "document.pdf";
    const isPdfMime = file.type === "application/pdf";
    const isPdfExt = fileName.toLowerCase().endsWith(".pdf");

    if (!isPdfMime && !isPdfExt) {
      return NextResponse.json(
        {
          error: "PDF 파일만 올릴 수 있어요.",
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "빈 파일이에요. 다른 PDF를 골라 주세요.",
          code: "EMPTY_FILE",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "파일이 500MB를 넘어요. 더 작은 PDF를 골라 주세요.",
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check PDF magic header (%PDF-)
    const header = buffer.subarray(0, 5).toString("ascii");
    if (header !== "%PDF-") {
      return NextResponse.json(
        {
          error: "유효한 PDF 파일 구조가 아닙니다. 손상되지 않은 PDF 문서를 업로드해 주세요.",
          code: "CORRUPTED_PDF",
        },
        { status: 400 }
      );
    }

    // 1. Upload file to Upstage Files API
    const uploaded = await uploadFileToUpstage(buffer, fileName, "application/pdf");

    // 2. Trigger Upstage Studio Agent workflow job
    const job = await createVerificationJob(uploaded.id);

    return NextResponse.json({
      jobId: job.id,
      fileId: uploaded.id,
      status: job.status,
    });
  } catch (error) {
    if (error instanceof UpstageApiError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error:
          (error as Error)?.message ||
          "문서를 보내는 중에 서버 오류가 났어요. 다시 시도해 주세요.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
