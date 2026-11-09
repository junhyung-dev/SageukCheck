import {
  DocumentSegment,
  NormalizedPoint,
  OutputKey,
  VerificationCitation,
  VerificationDecision,
  VerificationResult,
  UpstageJobResponse,
} from "@/types/verification";

const VALID_DECISIONS: VerificationDecision[] = ["일치", "충돌", "검토 필요"];

/**
 * Removes Upstage Studio inline grounding citation markers like `【†1】`, `【†12】`
 */
export function stripCitationMarkers(text: string): string {
  return text.replace(/【†\d+】/g, "").trim();
}

function normalizeDecision(val: unknown): VerificationDecision | null {
  if (typeof val !== "string") return null;
  const cleaned = stripCitationMarkers(val)
    .trim()
    .replace(/^["']|["']$/g, "");
  if (VALID_DECISIONS.includes(cleaned as VerificationDecision)) {
    return cleaned as VerificationDecision;
  }
  if (cleaned.includes("충돌") || cleaned.includes("모순") || cleaned.includes("불일치")) {
    return "충돌";
  }
  if (cleaned.includes("검토") || cleaned.includes("보류") || cleaned.includes("판단 불가")) {
    return "검토 필요";
  }
  if (cleaned.includes("일치") || cleaned.includes("부합")) {
    return "일치";
  }
  return null;
}

/**
 * Safely parses `missing_documents` which may be:
 * - An actual array: ["역사 사료", "검토 요청서"]
 * - A JSON array string: '["역사 사료"]' or "[]"
 * - A bracketed or comma-separated string: "[역사 사료, 실록]" or "역사 사료"
 * - "없음", "None", "null", ""
 */
export function parseMissingDocuments(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => stripCitationMarkers(String(item)).trim())
      .filter((item) => item.length > 0 && item !== "없음" && item.toLowerCase() !== "none");
  }
  if (typeof raw === "string") {
    const trimmed = stripCitationMarkers(raw).trim();
    if (
      !trimmed ||
      trimmed === "[]" ||
      trimmed === "없음" ||
      trimmed.toLowerCase() === "none" ||
      trimmed.toLowerCase() === "null"
    ) {
      return [];
    }

    // Try JSON parse first
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => stripCitationMarkers(String(item)).trim())
          .filter((item) => item.length > 0 && item !== "없음" && item.toLowerCase() !== "none");
      }
    } catch {
      // Fallback to manual bracket stripping and splitting
    }

    const withoutBrackets = trimmed.replace(/^\[|\]$/g, "").trim();
    if (!withoutBrackets) return [];

    return withoutBrackets
      .split(/[,;\n]+/)
      .map((s) => stripCitationMarkers(s).trim().replace(/^["']|["']$/g, ""))
      .filter((s) => s.length > 0 && s !== "없음" && s.toLowerCase() !== "none");
  }
  return [];
}

/**
 * Multi-line aware key-value parser for Instruct `content` string:
 * Example:
 * scene_id: SC-002【†1】
 * decision: 충돌【†2】
 * reason: 대본의 역사적 주장이 사료와 모순됩니다.
 * source_reference: 세종실록 103권
 * missing_documents: []
 */
export function parseMultilineKeyValueContent(content: string): {
  sceneId?: string;
  decision?: VerificationDecision | null;
  reason?: string;
  sourceReference?: string;
  missingDocuments?: string[];
  annotatedFields?: Partial<Record<OutputKey, string>>;
  matchedAnyKey: boolean;
} {
  // Unwrap if the entire content string is a JSON-encoded string (e.g. "\"scene_id: SC-001\\ndecision: 일치...\"")
  let unwrapped = content.trim();
  if (
    (unwrapped.startsWith('"') && unwrapped.endsWith('"')) ||
    unwrapped.includes("\\n")
  ) {
    try {
      const parsedStr = JSON.parse(unwrapped);
      if (typeof parsedStr === "string") {
        unwrapped = parsedStr;
      }
    } catch {
      // If JSON.parse fails but literal \n exists, unescape literal \n and outer quotes
      unwrapped = unwrapped
        .replace(/^"|"$/g, "")
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"');
    }
  }

  const knownKeys = [
    "scene_id",
    "sceneId",
    "decision",
    "reason",
    "source_reference",
    "sourceReference",
    "missing_documents",
    "missingDocuments",
  ];

  const keyRegex = new RegExp(
    `^[ \\t*-]*(${knownKeys.join("|")})\\s*:\\s*(.*)$`,
    "im"
  );

  const lines = unwrapped.replace(/\r\n/g, "\n").split("\n");
  const extracted: Record<string, string[]> = {};
  let currentKey: string | null = null;
  let matchedAnyKey = false;

  for (const line of lines) {
    const match = line.match(
      new RegExp(`^[ \\t*-]*(${knownKeys.join("|")})\\s*:\\s*(.*)$`, "i")
    );
    if (match) {
      matchedAnyKey = true;
      const rawKey = match[1].toLowerCase();
      const firstLineVal = match[2] ?? "";
      currentKey = rawKey;
      if (!extracted[currentKey]) {
        extracted[currentKey] = [];
      }
      if (firstLineVal.trim().length > 0) {
        extracted[currentKey].push(firstLineVal.trim());
      }
    } else if (currentKey) {
      extracted[currentKey].push(line);
    }
  }

  if (!matchedAnyKey && !keyRegex.test(unwrapped)) {
    return { matchedAnyKey: false };
  }

  const getJoined = (keys: string[]) => {
    for (const k of keys) {
      const val = extracted[k.toLowerCase()];
      if (val && val.length > 0) {
        return stripCitationMarkers(val.join("\n")).trim();
      }
    }
    return undefined;
  };

  // Same lookup as getJoined but keeps the `【†n】` citation markers.
  const getJoinedAnnotated = (keys: string[]) => {
    for (const k of keys) {
      const val = extracted[k.toLowerCase()];
      if (val && val.length > 0) {
        return val.join("\n").trim();
      }
    }
    return undefined;
  };

  const annotatedFields: Partial<Record<OutputKey, string>> = {};
  const annotatedSources: [OutputKey, string[]][] = [
    ["scene_id", ["scene_id", "sceneid"]],
    ["decision", ["decision"]],
    ["reason", ["reason"]],
    ["source_reference", ["source_reference", "sourcereference"]],
    ["missing_documents", ["missing_documents", "missingdocuments"]],
  ];
  for (const [outputKey, aliases] of annotatedSources) {
    const value = getJoinedAnnotated(aliases);
    if (value !== undefined) annotatedFields[outputKey] = value;
  }

  const sceneId = getJoined(["scene_id", "sceneid"]);
  const decisionRaw = getJoined(["decision"]);
  const reason = getJoined(["reason"]);
  const sourceReference = getJoined(["source_reference", "sourcereference"]);
  const missingDocsRaw = getJoined(["missing_documents", "missingdocuments"]);

  return {
    sceneId,
    decision: decisionRaw ? normalizeDecision(decisionRaw) : null,
    reason,
    sourceReference,
    missingDocuments:
      missingDocsRaw !== undefined ? parseMissingDocuments(missingDocsRaw) : undefined,
    annotatedFields,
    matchedAnyKey: true,
  };
}

function toNormalizedPoint(raw: unknown): NormalizedPoint | null {
  if (!raw || typeof raw !== "object") return null;
  const { x, y } = raw as { x?: unknown; y?: unknown };
  if (typeof x !== "number" || typeof y !== "number") return null;
  return { x, y };
}

function toPolygon(raw: unknown): NormalizedPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(toNormalizedPoint)
    .filter((p): p is NormalizedPoint => p !== null);
}

/**
 * Reads `additional_values.citations` as returned by the Instruct step.
 * Entries without a numeric `index` are dropped; nothing is inferred.
 */
export function parseCitations(raw: unknown): VerificationCitation[] {
  if (!Array.isArray(raw)) return [];
  const citations: VerificationCitation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    if (typeof c.index !== "number") continue;
    citations.push({
      index: c.index,
      sourceType: typeof c.source_type === "string" ? c.source_type : "",
      sourceRef:
        typeof c.source_ref === "string" || typeof c.source_ref === "number"
          ? String(c.source_ref)
          : "",
      page: typeof c.page === "number" ? c.page : null,
      coordinates: toPolygon(c.coordinates),
      wordCoordinates: Array.isArray(c.word_coordinates)
        ? c.word_coordinates.map(toPolygon).filter((poly) => poly.length > 0)
        : [],
    });
  }
  return citations.sort((a, b) => a.index - b.index);
}

function toPageRanges(raw: unknown): [number, number][] {
  if (!Array.isArray(raw)) return [];
  const ranges: [number, number][] = [];
  for (const r of raw) {
    if (
      Array.isArray(r) &&
      r.length === 2 &&
      typeof r[0] === "number" &&
      typeof r[1] === "number"
    ) {
      ranges.push([r[0], r[1]]);
    }
  }
  return ranges;
}

/**
 * Reads `additional_values.merge.items`: which pages Classify assigned to
 * which document type. Pages that went to no branch (e.g. very_others)
 * do not appear here.
 */
export function parseDocumentSegments(raw: unknown): DocumentSegment[] {
  if (!raw || typeof raw !== "object") return [];
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  const segments: DocumentSegment[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const i = item as { document_type?: unknown; page_ranges?: unknown };
    if (typeof i.document_type !== "string") continue;
    segments.push({
      documentType: i.document_type,
      pageRanges: toPageRanges(i.page_ranges),
    });
  }
  return segments;
}

/**
 * Normalizes any Upstage Studio Agent API output into a defensive VerificationResult.
 * Never throws and never fabricates historical sources or claims not present in the AI output.
 */
export function parseVerificationResponse(
  jobResponse: UpstageJobResponse | Record<string, unknown>
): VerificationResult {
  let rawText = "";
  let rawAdditionalValues: string | Record<string, unknown> | undefined;

  // 1. Extract output_text or last output step text + additional_values
  if (Array.isArray(jobResponse.output) && jobResponse.output.length > 0) {
    const lastStep = jobResponse.output[jobResponse.output.length - 1] as Record<
      string,
      unknown
    >;
    if (Array.isArray(lastStep?.content)) {
      for (const item of lastStep.content) {
        if (item && typeof item === "object") {
          const contentItem = item as {
            text?: unknown;
            additional_values?: string | Record<string, unknown>;
          };
          if (typeof contentItem.text === "string" && contentItem.text.trim()) {
            rawText = contentItem.text.trim();
          }
          if (contentItem.additional_values) {
            rawAdditionalValues = contentItem.additional_values;
          }
          if (rawText) break;
        }
      }
    }
  }

  if (!rawText && typeof jobResponse.output_text === "string" && jobResponse.output_text.trim()) {
    rawText = jobResponse.output_text.trim();
  } else if (!rawText && typeof (jobResponse as { content?: unknown }).content === "string") {
    rawText = ((jobResponse as { content: string }).content || "").trim();
  }

  // Parse additional_values (which in Upstage Studio Instruct step contains {"enum": "일치", "citations": [...]})
  let parsedAdditionalValues: Record<string, unknown> | undefined;
  if (typeof rawAdditionalValues === "string" && rawAdditionalValues.trim()) {
    try {
      const candidate = JSON.parse(rawAdditionalValues);
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        parsedAdditionalValues = candidate as Record<string, unknown>;
      }
    } catch {
      // Ignore
    }
  } else if (rawAdditionalValues && typeof rawAdditionalValues === "object") {
    parsedAdditionalValues = rawAdditionalValues as Record<string, unknown>;
  }

  let parsedJson: Record<string, unknown> | null = null;
  let unwrappedTextString: string | null = null;

  if (rawText) {
    try {
      const candidate = JSON.parse(rawText);
      if (typeof candidate === "string") {
        // Upstage Instruct step often returns a JSON-encoded string: "\"scene_id: SC-001\\ndecision: 일치...\""
        unwrappedTextString = candidate;
      } else if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        parsedJson = candidate as Record<string, unknown>;
      }
    } catch {
      const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (jsonBlockMatch?.[1]) {
        try {
          const candidate = JSON.parse(jsonBlockMatch[1].trim());
          if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
            parsedJson = candidate as Record<string, unknown>;
          }
        } catch {
          // Ignore
        }
      }
    }
  } else if (
    typeof (jobResponse as { content?: unknown }).content === "string" ||
    typeof (jobResponse as { metadata?: unknown }).metadata === "object"
  ) {
    parsedJson = jobResponse as Record<string, unknown>;
  }

  // Extract metadata / additional_values enum if available
  const metadata =
    (parsedJson?.metadata as Record<string, unknown> | undefined) ??
    parsedAdditionalValues ??
    ((jobResponse as { metadata?: Record<string, unknown> }).metadata || undefined);

  const enumDecision =
    (parsedAdditionalValues?.enum
      ? normalizeDecision(parsedAdditionalValues.enum)
      : null) ??
    (metadata?.enum ? normalizeDecision(metadata.enum) : null);

  // Content string inside unwrappedTextString, parsedJson.content, or rawText
  const contentString =
    unwrappedTextString ??
    (typeof parsedJson?.content === "string"
      ? parsedJson.content
      : typeof parsedJson?.output_text === "string"
      ? parsedJson.output_text
      : rawText);

  // Check if parsedJson directly has fields (scene_id, decision, reason, etc.)
  const directSceneId =
    (typeof parsedJson?.scene_id === "string" ? parsedJson.scene_id : undefined) ??
    (typeof parsedJson?.sceneId === "string" ? parsedJson.sceneId : undefined);
  const directDecision = normalizeDecision(parsedJson?.decision);
  const directReason =
    typeof parsedJson?.reason === "string" ? parsedJson.reason : undefined;
  const directSource =
    (typeof parsedJson?.source_reference === "string"
      ? parsedJson.source_reference
      : undefined) ??
    (typeof parsedJson?.sourceReference === "string"
      ? parsedJson.sourceReference
      : undefined);
  const directMissing =
    parsedJson?.missing_documents !== undefined
      ? parseMissingDocuments(parsedJson.missing_documents)
      : parsedJson?.missingDocuments !== undefined
      ? parseMissingDocuments(parsedJson.missingDocuments)
      : undefined;

  // Parse multiline key-value from contentString
  const kvParsed = contentString
    ? parseMultilineKeyValueContent(contentString)
    : { matchedAnyKey: false };

  // Priority for decision: enumDecision -> kvParsed.decision -> directDecision -> "검토 필요"
  const finalDecision: VerificationDecision =
    enumDecision ?? kvParsed.decision ?? directDecision ?? "검토 필요";

  const finalSceneId =
    stripCitationMarkers(kvParsed.sceneId || directSceneId || "").trim() ||
    "미지정 장면";

  const finalReason =
    stripCitationMarkers(kvParsed.reason || directReason || "").trim() ||
    (!kvParsed.matchedAnyKey && contentString
      ? stripCitationMarkers(contentString).trim()
      : "AI 응답에 상세 판정 근거가 포함되지 않았습니다.");

  const finalSourceReference =
    stripCitationMarkers(kvParsed.sourceReference || directSource || "").trim() ||
    "확인된 사료 출처 표기 없음";

  const finalMissingDocuments =
    kvParsed.missingDocuments ?? directMissing ?? [];

  const citations = parseCitations(parsedAdditionalValues?.citations);
  const documentSegments = parseDocumentSegments(parsedAdditionalValues?.merge);

  const isUnstructuredFallback =
    !kvParsed.matchedAnyKey && !directReason && !directSceneId && Boolean(contentString);

  return {
    sceneId: finalSceneId,
    decision: finalDecision,
    reason: finalReason,
    sourceReference: finalSourceReference,
    missingDocuments: finalMissingDocuments,
    annotatedFields: kvParsed.annotatedFields,
    citations,
    documentSegments,
    rawContent: contentString || JSON.stringify(jobResponse, null, 2),
    rawMetadata: metadata ? { enum: metadata.enum } : undefined,
    isUnstructuredFallback,
  };
}
