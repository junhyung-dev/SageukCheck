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
          error: "업로드할 PDF 파일이 전달되지 않았습니다. 파일을 선택한 후 다시 시도해 주세요.",
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
          error: `지원하지 않는 파일 형식입니다(${file.type || "알 수 없음"}). PDF 문서(.pdf)만 업로드할 수 있습니다.`,
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "빈 파일(0 byte)은 업로드할 수 없습니다. 정상적인 PDF 문서를 선택해 주세요.",
          code: "EMPTY_FILE",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "파일 크기가 최대 허용 한도(500MB)를 초과했습니다.",
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
          "문서 업로드 및 고증 워크플로우 요청 중 예기치 않은 서버 오류가 발생했습니다.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
