export type VerificationDecision = "일치" | "충돌" | "검토 필요";

export type VerificationResult = {
  sceneId: string;
  decision: VerificationDecision;
  reason: string;
  sourceReference: string;
  missingDocuments: string[];
  rawContent?: string;
  rawMetadata?: Record<string, unknown>;
  isUnstructuredFallback?: boolean;
};

export type JobStatus =
  | "uploading"
  | "queued"
  | "in_progress"
  | "completed"
  | "failed";

export interface UpstageJobStepContent {
  type: string;
  text?: string;
  additional_values?: string;
}

export interface UpstageJobStepOutput {
  type: string;
  status: string;
  role: string;
  model: string;
  content: UpstageJobStepContent[];
}

export interface UpstageJobResponse {
  id: string;
  object: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  model: string;
  output?: UpstageJobStepOutput[];
  output_text?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  error?: {
    message?: string;
    code?: string;
  };
}

export interface PollJobApiResponse {
  jobId: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  result?: VerificationResult;
  rawResponse?: unknown;
  error?: string;
}

export interface CreateVerifyApiResponse {
  jobId: string;
  fileId: string;
  status: "queued" | "in_progress" | "completed" | "failed";
}

export interface SampleDataset {
  id: string;
  code: string;
  title: string;
  episode: string;
  era: string;
  summary: string;
  expectedPoint: string;
  filename: string;
  pages: number;
}
