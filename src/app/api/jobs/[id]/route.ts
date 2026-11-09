import { NextRequest, NextResponse } from "next/server";
import {
  deleteUpstageFile,
  retrieveVerificationJob,
  UpstageApiError,
} from "@/lib/upstage";
import { parseVerificationResponse } from "@/lib/result-parser";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await context.params;
    const fileId = request.nextUrl.searchParams.get("fileId");

    if (!jobId) {
      return NextResponse.json(
        { error: "조회할 Job ID가 지정되지 않았습니다.", code: "MISSING_JOB_ID" },
        { status: 400 }
      );
    }

    const jobData = await retrieveVerificationJob(jobId);

    if (jobData.status === "failed") {
      if (fileId) {
        void deleteUpstageFile(fileId);
      }
      return NextResponse.json({
        jobId: jobData.id,
        status: "failed",
        error:
          jobData.error?.message ||
          "Upstage Studio 워크플로우 작업 실행이 실패(failed)했습니다. 문서 구성을 확인하거나 다시 시도해 주세요.",
        rawResponse: jobData,
      });
    }

    if (jobData.status === "completed") {
      const normalizedResult = parseVerificationResponse(jobData);
      if (fileId) {
        void deleteUpstageFile(fileId);
      }

      return NextResponse.json({
        jobId: jobData.id,
        status: "completed",
        result: normalizedResult,
        rawResponse: jobData,
      });
    }

    // queued or in_progress
    return NextResponse.json({
      jobId: jobData.id,
      status: jobData.status,
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
          "작업 상태 조회 중 서버 오류가 발생했습니다.",
        code: "INTERNAL_POLL_ERROR",
      },
      { status: 500 }
    );
  }
}
