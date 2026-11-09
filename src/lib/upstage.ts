import { UpstageJobResponse } from "@/types/verification";

const UPSTAGE_BASE_URL = "https://api.upstage.ai/v2";
const DEFAULT_AGENT_ID = "agt_BeWFUxUXkK7tzMpxscYduZ";
const DEFAULT_CONFIG_ID = "1";

export class UpstageApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code = "UPSTAGE_API_ERROR") {
    super(message);
    this.name = "UpstageApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function getUpstageConfig() {
  const apiKey = process.env.UPSTAGE_API_KEY?.trim();
  const agentId = process.env.UPSTAGE_AGENT_ID?.trim() || DEFAULT_AGENT_ID;
  const configId = process.env.UPSTAGE_CONFIG_ID?.trim() || DEFAULT_CONFIG_ID;

  if (!apiKey || apiKey === "up_your_api_key_here") {
    throw new UpstageApiError(
      "서버에 UPSTAGE_API_KEY 환경 변수가 설정되지 않았습니다. .env.local 또는 환경 변수를 확인해 주세요.",
      401,
      "MISSING_API_KEY"
    );
  }

  return { apiKey, agentId, configId };
}

function mapStatusToKoreanMessage(status: number, detail?: string): string {
  switch (status) {
    case 401:
      return "Upstage API 인증에 실패했습니다(401). UPSTAGE_API_KEY가 유효한지 확인해 주세요.";
    case 404:
      return "요청한 Agent 또는 Job을 찾을 수 없습니다(404). Agent ID 및 Job ID를 확인해 주세요.";
    case 413:
      return "업로드한 문서 용량이 허용 한도(최대 500MB, 1,000페이지)를 초과했습니다(413).";
    case 429:
      return "API 요청 한도를 초과했습니다(429). 잠시 후 다시 시도해 주세요.";
    case 500:
    case 502:
    case 503:
    case 504:
      return `Upstage 서버에서 일시적인 오류가 발생했습니다(${status}). 잠시 후 다시 시도해 주세요.`;
    default:
      return detail
        ? `Upstage API 요청 중 오류가 발생했습니다(${status}): ${detail}`
        : `Upstage API 요청 중 오류가 발생했습니다(상태 코드: ${status}).`;
  }
}

/**
 * Step 1: Upload PDF file to Upstage Files API (`POST https://api.upstage.ai/v2/files`)
 */
export async function uploadFileToUpstage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType = "application/pdf"
): Promise<{ id: string }> {
  const { apiKey } = getUpstageConfig();

  const formData = new FormData();
  const uint8Array = new Uint8Array(fileBuffer);
  const blob = new Blob([uint8Array], { type: mimeType });
  formData.append("file", blob, fileName || "document.pdf");
  formData.append("purpose", "user_data");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(`${UPSTAGE_BASE_URL}/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new UpstageApiError(
        mapStatusToKoreanMessage(response.status, errorText.slice(0, 200)),
        response.status,
        `FILE_UPLOAD_${response.status}`
      );
    }

    const data = (await response.json()) as { id?: string };
    if (!data?.id) {
      throw new UpstageApiError(
        "Upstage Files API 응답에 파일 ID(id)가 포함되지 않았습니다.",
        500,
        "INVALID_FILE_RESPONSE"
      );
    }

    return { id: data.id };
  } catch (error) {
    if (error instanceof UpstageApiError) throw error;
    if ((error as Error)?.name === "AbortError") {
      throw new UpstageApiError(
        "문서 업로드 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.",
        504,
        "UPLOAD_TIMEOUT"
      );
    }
    throw new UpstageApiError(
      `문서 업로드 중 네트워크 오류가 발생했습니다: ${(error as Error).message}`,
      500,
      "UPLOAD_NETWORK_ERROR"
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Step 2: Create Agent Job (`POST https://api.upstage.ai/v2/responses`)
 */
export async function createVerificationJob(
  fileId: string
): Promise<UpstageJobResponse> {
  const { apiKey, agentId, configId } = getUpstageConfig();

  const payload: Record<string, unknown> = {
    model: agentId,
    include: ["last"],
    input: [
      {
        role: "user",
        content: [{ type: "input_file", file_id: fileId }],
      },
    ],
  };

  if (configId) {
    payload.config_id = configId;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${UPSTAGE_BASE_URL}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new UpstageApiError(
        mapStatusToKoreanMessage(response.status, errorText.slice(0, 200)),
        response.status,
        `CREATE_JOB_${response.status}`
      );
    }

    const data = (await response.json()) as UpstageJobResponse;
    if (!data?.id) {
      throw new UpstageApiError(
        "Upstage Studio 워크플로우 실행 요청 응답에 Job ID가 없습니다.",
        500,
        "INVALID_JOB_RESPONSE"
      );
    }

    return data;
  } catch (error) {
    if (error instanceof UpstageApiError) throw error;
    if ((error as Error)?.name === "AbortError") {
      throw new UpstageApiError(
        "워크플로우 작업 생성 요청 시간이 초과되었습니다.",
        504,
        "CREATE_JOB_TIMEOUT"
      );
    }
    throw new UpstageApiError(
      `워크플로우 실행 요청 중 오류가 발생했습니다: ${(error as Error).message}`,
      500,
      "CREATE_JOB_NETWORK_ERROR"
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Step 3: Poll Job Status (`GET https://api.upstage.ai/v2/responses/{job_id}?include[]=last`)
 */
export async function retrieveVerificationJob(
  jobId: string
): Promise<UpstageJobResponse> {
  const { apiKey } = getUpstageConfig();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const url = `${UPSTAGE_BASE_URL}/responses/${encodeURIComponent(
      jobId
    )}?include[]=last`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new UpstageApiError(
        mapStatusToKoreanMessage(response.status, errorText.slice(0, 200)),
        response.status,
        `POLL_JOB_${response.status}`
      );
    }

    const data = (await response.json()) as UpstageJobResponse;
    return data;
  } catch (error) {
    if (error instanceof UpstageApiError) throw error;
    if ((error as Error)?.name === "AbortError") {
      throw new UpstageApiError(
        "작업 상태 조회 시간이 초과되었습니다. 잠시 후 다시 조회합니다.",
        504,
        "POLL_TIMEOUT"
      );
    }
    throw new UpstageApiError(
      `작업 상태 조회 중 네트워크 오류가 발생했습니다: ${(error as Error).message}`,
      500,
      "POLL_NETWORK_ERROR"
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Step 4: Optional file cleanup (`DELETE https://api.upstage.ai/v2/files/{file_id}`)
 * Prevents unnecessary long-term retention of uploaded documents.
 */
export async function deleteUpstageFile(fileId: string): Promise<void> {
  if (!fileId) return;
  try {
    const { apiKey } = getUpstageConfig();
    await fetch(`${UPSTAGE_BASE_URL}/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });
  } catch {
    // Ignore cleanup errors so user flow isn't interrupted
  }
}
