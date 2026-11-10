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
        { error: "조회할 작업 번호가 없어요.", code: "MISSING_JOB_ID" },
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
          "워크플로우 실행이 실패했어요. 대본과 사료가 한 PDF에 들어 있는지 확인하고 다시 시도해 주세요.",
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
          "진행 상태를 확인하는 중에 서버 오류가 났어요.",
        code: "INTERNAL_POLL_ERROR",
      },
      { status: 500 }
    );
  }
}
