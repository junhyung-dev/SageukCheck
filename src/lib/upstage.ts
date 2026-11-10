import { UpstageJobResponse } from "@/types/verification";

const UPSTAGE_BASE_URL = "https://api.upstage.ai/v2";
// 최종 워크플로우 `최종_사극체크` config 4 (라이브러리 게시 · 제출 JSON과 같은 버전)
const DEFAULT_AGENT_ID = "agt_bRU6jFjmhXuXGi8KLZucvp";
const DEFAULT_CONFIG_ID = "4";

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
  const projectId = process.env.UPSTAGE_PROJECT_ID?.trim() || undefined;

  if (!apiKey || apiKey === "up_your_api_key_here") {
    throw new UpstageApiError(
      "서버에 UPSTAGE_API_KEY가 설정되어 있지 않아요. 환경 변수를 확인해 주세요.",
      401,
      "MISSING_API_KEY"
    );
  }

  return { apiKey, agentId, configId, projectId };
}

/**
 * Builds auth headers for every Upstage request.
 * Agents that belong to a Studio Project require `x-project-id` on file upload,
 * job creation and polling; files uploaded without it are stored outside the
 * Project and cannot be used by the agent.
 */
function buildUpstageHeaders(
  apiKey: string,
  projectId?: string,
  extra: Record<string, string> = {}
): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    ...(projectId ? { "x-project-id": projectId } : {}),
    ...extra,
  };
}

function mapStatusToKoreanMessage(status: number, detail?: string): string {
  switch (status) {
    case 401:
      return "Upstage API 인증에 실패했어요(401). UPSTAGE_API_KEY를 확인해 주세요.";
    case 404:
      return "워크플로우나 작업을 찾지 못했어요(404). 설정된 에이전트 ID와 설정 번호를 확인해 주세요.";
    case 413:
      return "문서가 너무 커서 받지 못했어요(413). 더 작은 PDF로 다시 시도해 주세요.";
    case 429:
      return "요청이 너무 많아요(429). 잠시 뒤에 다시 시도해 주세요.";
    case 500:
    case 502:
    case 503:
    case 504:
      return `Upstage 서버에 잠깐 문제가 생겼어요(${status}). 잠시 뒤에 다시 시도해 주세요.`;
    default:
      return detail
        ? `Upstage API 요청이 실패했어요(${status}): ${detail}`
        : `Upstage API 요청이 실패했어요(${status}).`;
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
  const { apiKey, projectId } = getUpstageConfig();

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
      headers: buildUpstageHeaders(apiKey, projectId),
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
        "파일을 올렸지만 Upstage가 파일 번호를 돌려주지 않았어요. 다시 시도해 주세요.",
        500,
        "INVALID_FILE_RESPONSE"
      );
    }

    return { id: data.id };
  } catch (error) {
    if (error instanceof UpstageApiError) throw error;
    if ((error as Error)?.name === "AbortError") {
      throw new UpstageApiError(
        "문서를 올리는 데 시간이 너무 오래 걸렸어요. 인터넷 연결을 확인하고 다시 시도해 주세요.",
        504,
        "UPLOAD_TIMEOUT"
      );
    }
    throw new UpstageApiError(
      `문서를 올리는 중에 연결이 끊겼어요: ${(error as Error).message}`,
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
  fileId: string,
  // 30초에서는 동시 실행 중 응답이 늦어 끊긴 적이 있다 (docs/UPSTAGE_API.md 1절)
  timeoutMs = 120_000
): Promise<UpstageJobResponse> {
  const { apiKey, agentId, configId, projectId } = getUpstageConfig();

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
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${UPSTAGE_BASE_URL}/responses`, {
      method: "POST",
      headers: buildUpstageHeaders(apiKey, projectId, {
        "Content-Type": "application/json",
      }),
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
        "워크플로우 실행을 요청했지만 작업 번호를 받지 못했어요. 다시 시도해 주세요.",
        500,
        "INVALID_JOB_RESPONSE"
      );
    }

    return data;
  } catch (error) {
    if (error instanceof UpstageApiError) throw error;
    if ((error as Error)?.name === "AbortError") {
      throw new UpstageApiError(
        "워크플로우 실행을 요청하는 데 시간이 너무 오래 걸렸어요. 다시 시도해 주세요.",
        504,
        "CREATE_JOB_TIMEOUT"
      );
    }
    throw new UpstageApiError(
      `워크플로우 실행을 요청하는 중에 연결이 끊겼어요: ${(error as Error).message}`,
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
  const { apiKey, projectId } = getUpstageConfig();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const url = `${UPSTAGE_BASE_URL}/responses/${encodeURIComponent(
      jobId
    )}?include[]=last`;

    const response = await fetch(url, {
      method: "GET",
      headers: buildUpstageHeaders(apiKey, projectId),
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
        "진행 상태를 확인하는 데 시간이 오래 걸리고 있어요. 잠시 뒤에 다시 확인해요.",
        504,
        "POLL_TIMEOUT"
      );
    }
    throw new UpstageApiError(
      `진행 상태를 확인하는 중에 연결이 끊겼어요: ${(error as Error).message}`,
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
    const { apiKey, projectId } = getUpstageConfig();
    await fetch(`${UPSTAGE_BASE_URL}/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: buildUpstageHeaders(apiKey, projectId),
      cache: "no-store",
    });
  } catch {
    // Ignore cleanup errors so user flow isn't interrupted
  }
}
