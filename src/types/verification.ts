export type VerificationDecision = "일치" | "충돌" | "검토 필요";

/** Output keys of the 역사고증_판정 Instruct node (same as the answer sheet). */
export type OutputKey =
  | "scene_id"
  | "decision"
  | "reason"
  | "source_reference"
  | "missing_documents";

/** A point normalized to the page size (0~1, origin top-left). */
export type NormalizedPoint = { x: number; y: number };

/**
 * One grounding citation from `additional_values.citations`.
 * `index` matches the inline marker `【†index】` in the Instruct output text.
 * `page` is 1-based and refers to the page of the uploaded PDF.
 */
export type VerificationCitation = {
  index: number;
  /** "extract" (value from an Extract node) or "parse" (Parse element). */
  sourceType: string;
  /** Extract field path (e.g. `record_rows[3].record_quote`) or Parse element id. */
  sourceRef: string;
  page: number | null;
  /** Bounding polygon of the cited region. */
  coordinates: NormalizedPoint[];
  /** Word-level polygons inside the cited region (may be empty). */
  wordCoordinates: NormalizedPoint[][];
};

/**
 * One document found by Classify, from `additional_values.merge.items`.
 * `documentType` is the Classify category (script, source_record, ...).
 */
export type DocumentSegment = {
  documentType: string;
  /** Inclusive 1-based page ranges, e.g. [[1, 2]]. */
  pageRanges: [number, number][];
};

export type VerificationResult = {
  sceneId: string;
  decision: VerificationDecision;
  reason: string;
  sourceReference: string;
  missingDocuments: string[];
  /** Output text per key with the `【†n】` markers kept, for linking to citations. */
  annotatedFields?: Partial<Record<OutputKey, string>>;
  citations?: VerificationCitation[];
  documentSegments?: DocumentSegment[];
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
  /** case_id in the answer sheet (A ~ R). */
  caseId: string;
  code: string;
  /** decision in the answer sheet for this case. */
  expectedDecision: VerificationDecision;
  /** documents in the answer sheet for this case. */
  documents: string[];
  title: string;
  episode: string;
  era: string;
  summary: string;
  expectedPoint: string;
  filename: string;
  pages: number;
}
