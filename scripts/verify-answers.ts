/**
 * 정답지 자동 대조 스크립트
 *
 * 정답지(answer.json)에 적힌 케이스를 Upstage Studio 워크플로우로 실제 실행하고,
 * 출력 키 값을 정답과 글자 단위로 비교한다. 사용법은 docs/VERIFY.md 참고.
 *
 *   npm run verify:answers -- --answer data/mission2/경크크_미션2_answer.json
 *   npm run verify:answers -- --answer <path> --check-only
 */
import fs from "node:fs";
import path from "node:path";
import {
  createVerificationJob,
  deleteUpstageFile,
  getUpstageConfig,
  retrieveVerificationJob,
  uploadFileToUpstage,
  UpstageApiError,
} from "../src/lib/upstage";
import { stripCitationMarkers } from "../src/lib/result-parser";
import type { UpstageJobResponse } from "../src/types/verification";

// ---------------------------------------------------------------------------
// 옵션
// ---------------------------------------------------------------------------

type Options = {
  answer: string;
  dir: string;
  checkOnly: boolean;
  cases: string[] | null;
  concurrency: number;
  repeat: number;
  timeoutSec: number;
  pollSec: number;
  config: string | null;
  skipKeys: string[];
  expectPrefix: string | null;
  out: string;
  keepFiles: boolean;
};

const HELP = `
정답지 자동 대조 스크립트

사용법:
  npm run verify:answers -- --answer <정답지.json> [옵션]

필수:
  --answer <path>        정답지 JSON 경로

옵션:
  --dir <path>           데이터셋 파일이 있는 폴더 (기본: 정답지와 같은 폴더)
  --check-only           API를 호출하지 않고 정답지·파일만 점검
  --cases A,B            지정한 case_id만 실행
  --concurrency <n>      동시에 실행할 케이스 수 (기본: 3)
  --repeat <n>           케이스마다 반복 실행 횟수, 재현성 확인용 (기본: 1)
  --timeout <sec>        케이스 1건 최대 대기 시간(초) (기본: 900)
  --poll <sec>           상태 조회 간격(초) (기본: 3)
  --config <id>          .env의 UPSTAGE_CONFIG_ID 대신 사용할 config 번호
  --skip-keys <k1,k2>    자동 비교에서 뺄 키 (기본: reason)
  --expect-prefix <str>  모든 file 이름이 이 접두어로 시작하는지 점검 (예: 경크크_최종제출_)
  --out <path>           리포트 저장 폴더 (기본: verify-reports/<시각>)
  --keep-files           실행 후 Upstage에 올린 파일을 지우지 않음
  -h, --help             도움말

종료 코드:
  0  모든 점검·비교 통과
  1  불일치, 실패 또는 시간초과 케이스 있음
  2  사전 점검 오류 또는 잘못된 옵션
`;

function parseArgs(argv: string[]): Options {
  const get = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    if (i === -1) return undefined;
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) fail(`${name} 옵션에 값이 필요합니다.`);
    return v;
  };
  const has = (name: string) => argv.includes(name);
  const toInt = (name: string, fallback: number) => {
    const v = get(name);
    if (v === undefined) return fallback;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1) fail(`${name} 값은 1 이상의 정수여야 합니다: ${v}`);
    return n;
  };
  const list = (v: string | undefined) =>
    v === undefined ? undefined : v.split(",").map((s) => s.trim()).filter(Boolean);

  if (has("-h") || has("--help")) {
    console.log(HELP);
    process.exit(0);
  }

  const answer = get("--answer");
  if (!answer) fail("--answer <정답지.json> 옵션이 필요합니다. --help 참고.");

  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "-")
    .slice(0, 15);

  return {
    answer: path.resolve(answer!),
    dir: path.resolve(get("--dir") ?? path.dirname(answer!)),
    checkOnly: has("--check-only"),
    cases: list(get("--cases")) ?? null,
    concurrency: toInt("--concurrency", 3),
    repeat: toInt("--repeat", 1),
    timeoutSec: toInt("--timeout", 900),
    pollSec: toInt("--poll", 3),
    config: get("--config") ?? null,
    skipKeys: list(get("--skip-keys")) ?? ["reason"],
    expectPrefix: get("--expect-prefix") ?? null,
    out: path.resolve(get("--out") ?? path.join("verify-reports", stamp)),
    keepFiles: has("--keep-files"),
  };
}

function fail(message: string): never {
  console.error(`오류: ${message}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// 1. 사전 점검 (API 호출 없음)
// ---------------------------------------------------------------------------

type AnswerValue = string | string[];
type AnswerCase = {
  case_id: string;
  file: string | string[];
  documents: string[];
  answer: Record<string, AnswerValue>;
};
type AnswerSheet = {
  task: string;
  unit: string;
  output_keys: string[];
  decision_values: string[];
  cases: AnswerCase[];
};

type CheckReport = { errors: string[]; warnings: string[]; infos: string[] };

const TEMPLATE_KEYS = ["task", "unit", "output_keys", "decision_values", "cases"];
const CASE_KEYS = ["case_id", "file", "documents", "answer"];

function precheck(opts: Options): { sheet: AnswerSheet | null; report: CheckReport } {
  const report: CheckReport = { errors: [], warnings: [], infos: [] };
  const { errors, warnings, infos } = report;

  if (!fs.existsSync(opts.answer)) {
    errors.push(`정답지 파일이 없습니다: ${opts.answer}`);
    return { sheet: null, report };
  }

  let sheet: AnswerSheet;
  try {
    sheet = JSON.parse(fs.readFileSync(opts.answer, "utf8"));
  } catch (e) {
    errors.push(`정답지 JSON 문법 오류: ${(e as Error).message}`);
    return { sheet: null, report };
  }

  const topKeys = Object.keys(sheet);
  for (const k of TEMPLATE_KEYS) {
    if (!topKeys.includes(k)) errors.push(`템플릿 키 누락: "${k}"`);
  }
  for (const k of topKeys) {
    if (!TEMPLATE_KEYS.includes(k)) errors.push(`템플릿에 없는 최상위 키: "${k}"`);
  }
  if (!Array.isArray(sheet.output_keys) || sheet.output_keys.length === 0) {
    errors.push(`output_keys가 비어 있거나 배열이 아닙니다.`);
    return { sheet: null, report };
  }
  if (!Array.isArray(sheet.cases) || sheet.cases.length === 0) {
    errors.push(`cases가 비어 있거나 배열이 아닙니다.`);
    return { sheet: null, report };
  }
  const decisionValues = Array.isArray(sheet.decision_values) ? sheet.decision_values : [];
  const hasDecisionKey = sheet.output_keys.includes("decision");

  const seenIds = new Set<string>();
  let documentCount = 0;
  let reviewCaseCount = 0;

  for (const c of sheet.cases) {
    const id = c?.case_id ?? "(case_id 없음)";
    const tag = `[${id}]`;

    for (const k of CASE_KEYS) {
      if (!(k in (c ?? {}))) errors.push(`${tag} 케이스 키 누락: "${k}"`);
    }
    for (const k of Object.keys(c ?? {})) {
      if (!CASE_KEYS.includes(k)) errors.push(`${tag} 템플릿에 없는 케이스 키: "${k}"`);
    }

    if (seenIds.has(id)) errors.push(`${tag} case_id 중복`);
    seenIds.add(id);

    // file
    const files = Array.isArray(c.file) ? c.file : [c.file];
    if (Array.isArray(c.file)) {
      warnings.push(
        `${tag} file이 목록(파일 ${c.file.length}개)입니다. Studio API는 실행 1건에 파일 1개만 받으므로 이 스크립트로는 실행할 수 없습니다.`
      );
    }
    for (const f of files) {
      if (typeof f !== "string" || !f) {
        errors.push(`${tag} file 값이 비어 있습니다.`);
        continue;
      }
      if (!fs.existsSync(path.join(opts.dir, f))) {
        errors.push(`${tag} 파일이 없습니다: ${f} (폴더: ${opts.dir})`);
      }
      if (opts.expectPrefix && !f.startsWith(opts.expectPrefix)) {
        errors.push(`${tag} 파일 이름이 "${opts.expectPrefix}"로 시작하지 않습니다: ${f}`);
      }
    }

    // documents
    if (!Array.isArray(c.documents) || c.documents.length === 0) {
      errors.push(`${tag} documents가 비어 있거나 배열이 아닙니다.`);
    } else {
      documentCount += c.documents.length;
    }

    // answer
    const answerKeys = Object.keys(c.answer ?? {});
    for (const k of sheet.output_keys) {
      if (!answerKeys.includes(k)) errors.push(`${tag} answer에 output_keys의 "${k}"가 없습니다.`);
    }
    for (const k of answerKeys) {
      if (!sheet.output_keys.includes(k)) errors.push(`${tag} answer에 output_keys에 없는 키 "${k}"가 있습니다.`);
    }
    if (hasDecisionKey) {
      const d = c.answer?.decision;
      if (typeof d !== "string" || !decisionValues.includes(d)) {
        errors.push(`${tag} decision 값 "${String(d)}"이 decision_values(${decisionValues.join(", ")})에 없습니다.`);
      }
      if (d === "검토 필요") reviewCaseCount += 1;
    }
  }

  infos.push(`케이스 ${sheet.cases.length}건, 문서 ${documentCount}건 (documents 목록 기준)`);
  if (documentCount < 20) {
    warnings.push(`문서가 ${documentCount}건입니다. 최종 제출은 20건 이상이어야 합니다.`);
  }
  if (hasDecisionKey) {
    if (!decisionValues.includes("검토 필요")) {
      warnings.push(`decision_values에 "검토 필요"가 없습니다. 같은 의미의 보류 값이 있는지 확인하세요.`);
    } else if (reviewCaseCount === 0) {
      warnings.push(`정답이 "검토 필요"인 케이스가 없습니다. 반드시 포함해야 합니다.`);
    } else {
      infos.push(`정답이 "검토 필요"인 케이스 ${reviewCaseCount}건`);
    }
  }

  return { sheet, report };
}

// ---------------------------------------------------------------------------
// 2. 출력 추출 (서비스 파서와 달리 기본값을 채우지 않는다)
// ---------------------------------------------------------------------------

type Extracted = {
  /** 출력에서 찾은 키별 원문 값 (인용 표시 제거 전) */
  rawValues: Record<string, string>;
  /** 정답지 키와 표기가 다른 키 (예: Scene_ID) */
  keyNameMismatches: Record<string, string>;
  /** additional_values.enum */
  enumValue: string | null;
  /** 마지막 단계 텍스트 원문 */
  text: string;
  /** 출력이 JSON 객체였는지 */
  isJsonObject: boolean;
};

const normalizeKey = (k: string) => k.toLowerCase().replace(/[\s_\-]/g, "");

function getLastStepContent(job: UpstageJobResponse): { text: string; additional: unknown } {
  const steps = job.output ?? [];
  const last = steps[steps.length - 1];
  for (const c of last?.content ?? []) {
    if (typeof c.text === "string" && c.text.trim()) {
      return { text: c.text, additional: c.additional_values };
    }
  }
  return { text: typeof job.output_text === "string" ? job.output_text : "", additional: undefined };
}

function extractOutput(job: UpstageJobResponse, outputKeys: string[]): Extracted {
  const { text, additional } = getLastStepContent(job);

  let enumValue: string | null = null;
  try {
    const av = typeof additional === "string" ? JSON.parse(additional) : additional;
    if (av && typeof av === "object" && typeof (av as { enum?: unknown }).enum === "string") {
      enumValue = (av as { enum: string }).enum;
    }
  } catch {
    // additional_values가 JSON이 아니면 무시
  }

  // Instruct 출력은 JSON 문자열로 한 번 감싸져 오는 경우가 있다: "\"scene_id: ...\""
  let body = text.trim();
  let isJsonObject = false;
  const rawValues: Record<string, string> = {};
  const keyNameMismatches: Record<string, string> = {};
  const wanted = new Map(outputKeys.map((k) => [normalizeKey(k), k]));

  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === "string") {
      body = parsed;
    } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      isJsonObject = true;
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        const target = wanted.get(normalizeKey(k));
        if (!target) continue;
        rawValues[target] = typeof v === "string" ? v : JSON.stringify(v);
        if (k !== target) keyNameMismatches[target] = k;
      }
      return { rawValues, keyNameMismatches, enumValue, text, isJsonObject };
    }
  } catch {
    // key: value 텍스트로 처리
  }

  // key: value 줄 파싱. 키로 시작하지 않는 줄은 직전 키의 값에 이어 붙인다.
  let current: string | null = null;
  const buffers: Record<string, string[]> = {};
  for (const line of body.replace(/\r\n/g, "\n").split("\n")) {
    const m = line.match(/^[ \t*\-]*([A-Za-z][A-Za-z0-9_ \-]*?)\s*:\s?(.*)$/);
    const target = m ? wanted.get(normalizeKey(m[1])) : undefined;
    if (m && target) {
      current = target;
      buffers[target] = [m[2]];
      if (m[1] !== target) keyNameMismatches[target] = m[1];
    } else if (current) {
      buffers[current].push(line);
    }
  }
  for (const [k, lines] of Object.entries(buffers)) {
    rawValues[k] = lines.join("\n").trim();
  }
  return { rawValues, keyNameMismatches, enumValue, text, isJsonObject };
}

// ---------------------------------------------------------------------------
// 3. 비교
// ---------------------------------------------------------------------------

type KeyResult = {
  key: string;
  status: "pass" | "fail" | "skipped";
  expected: AnswerValue;
  actual: AnswerValue | null;
  note?: string;
};

function compareKey(key: string, expected: AnswerValue, ex: Extracted): KeyResult {
  const raw = ex.rawValues[key];
  if (raw === undefined) {
    return { key, status: "fail", expected, actual: null, note: "출력에 키가 없음" };
  }
  const notes: string[] = [];
  if (ex.keyNameMismatches[key]) notes.push(`출력 키 표기가 "${ex.keyNameMismatches[key]}"`);
  if (/【†\d+】/.test(raw)) notes.push("인용 표시【†n】 제거 후 비교");
  const cleaned = stripCitationMarkers(raw).trim();

  if (Array.isArray(expected)) {
    let actual: string[] | null = null;
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) actual = parsed.map((v) => String(v));
    } catch {
      // 아래에서 처리
    }
    if (actual === null) {
      return {
        key,
        status: "fail",
        expected,
        actual: cleaned,
        note: [...notes, "JSON 배열 형식이 아님"].join(", "),
      };
    }
    const same = actual.length === expected.length && actual.every((v, i) => v === expected[i]);
    return { key, status: same ? "pass" : "fail", expected, actual, note: notes.join(", ") || undefined };
  }

  if (/^["'“][\s\S]*["'”]$/.test(cleaned)) notes.push("값이 따옴표로 감싸여 있음");
  const same = cleaned === String(expected);
  if (key === "decision" && ex.enumValue !== null && ex.enumValue !== cleaned) {
    notes.push(`enum 값 "${ex.enumValue}"과 텍스트 값이 다름`);
  }
  return { key, status: same ? "pass" : "fail", expected, actual: cleaned, note: notes.join(", ") || undefined };
}

// ---------------------------------------------------------------------------
// 4. 실행
// ---------------------------------------------------------------------------

type RunResult = {
  caseId: string;
  file: string;
  run: number;
  status: "completed" | "failed" | "timeout" | "error" | "skipped";
  elapsedSec: number;
  jobId?: string;
  error?: string;
  keys: KeyResult[];
  reason?: { expected: AnswerValue; actual: string | null };
  rawFile?: string;
  usage?: UpstageJobResponse["usage"];
};

const CREATE_JOB_TIMEOUT_MS = 120_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 4): Promise<T> {
  let delay = 2000;
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const status = e instanceof UpstageApiError ? e.statusCode : 0;
      // 클라이언트 타임아웃(*_TIMEOUT)은 서버가 이미 처리했을 수 있어 재시도하지 않는다.
      const clientTimeout = e instanceof UpstageApiError && e.code.endsWith("_TIMEOUT");
      const retryable = !clientTimeout && (status === 429 || status >= 500);
      if (!retryable || i >= attempts) throw e;
      log(`  ${label}: ${status} 응답, ${delay / 1000}초 후 재시도 (${i}/${attempts - 1})`);
      await sleep(delay);
      delay *= 2;
    }
  }
}

function log(msg: string) {
  const t = new Date().toTimeString().slice(0, 8);
  console.log(`[${t}] ${msg}`);
}

async function runCase(
  c: AnswerCase,
  run: number,
  sheet: AnswerSheet,
  opts: Options
): Promise<RunResult> {
  const file = c.file as string;
  const label = `${c.case_id}#${run}`;
  const started = Date.now();
  const elapsed = () => Math.round((Date.now() - started) / 1000);
  const base = { caseId: c.case_id, file, run, keys: [] as KeyResult[] };
  let fileId: string | undefined;

  try {
    const buffer = fs.readFileSync(path.join(opts.dir, file));
    const uploaded = await withRetry(`${label} 업로드`, () => uploadFileToUpstage(buffer, file));
    fileId = uploaded.id;
    // 실행 요청은 응답이 30초를 넘기는 경우가 있다. 클라이언트 쪽에서 먼저 끊고 재시도하면
    // 서버에 job이 중복으로 생길 수 있으므로 넉넉하게 기다린다.
    const job = await withRetry(`${label} 실행 요청`, () =>
      createVerificationJob(uploaded.id, CREATE_JOB_TIMEOUT_MS)
    );
    log(`${label} 실행 시작 (job ${job.id})`);

    let current: UpstageJobResponse = job;
    while (current.status === "queued" || current.status === "in_progress") {
      if (elapsed() > opts.timeoutSec) {
        log(`${label} 시간초과 (${opts.timeoutSec}초)`);
        return { ...base, status: "timeout", elapsedSec: elapsed(), jobId: job.id };
      }
      await sleep(opts.pollSec * 1000);
      try {
        current = await retrieveVerificationJob(job.id);
      } catch (e) {
        // 조회 실패는 일시적일 수 있으므로 시간초과 전까지 계속 조회한다.
        log(`${label} 상태 조회 실패, 계속 시도: ${(e as Error).message}`);
      }
    }

    const rawDir = path.join(opts.out, "raw");
    fs.mkdirSync(rawDir, { recursive: true });
    const rawFile = path.join(rawDir, `${c.case_id}-run${run}.json`);
    fs.writeFileSync(rawFile, JSON.stringify(current, null, 2));

    if (current.status !== "completed") {
      log(`${label} 실패 (${elapsed()}초)`);
      return {
        ...base,
        status: "failed",
        elapsedSec: elapsed(),
        jobId: job.id,
        error: current.error?.message ?? `status: ${current.status}`,
        rawFile,
      };
    }

    const ex = extractOutput(current, sheet.output_keys);
    const keys = sheet.output_keys.map((k) =>
      opts.skipKeys.includes(k)
        ? { key: k, status: "skipped" as const, expected: c.answer[k], actual: ex.rawValues[k] !== undefined ? stripCitationMarkers(ex.rawValues[k]) : null }
        : compareKey(k, c.answer[k], ex)
    );
    const passed = keys.every((k) => k.status !== "fail");
    log(`${label} 완료 (${elapsed()}초) ${passed ? "✅ 정답 일치" : "❌ 불일치"}`);

    return {
      ...base,
      status: "completed",
      elapsedSec: elapsed(),
      jobId: job.id,
      keys,
      reason:
        "reason" in c.answer
          ? {
              expected: c.answer.reason,
              actual: ex.rawValues.reason !== undefined ? stripCitationMarkers(ex.rawValues.reason) : null,
            }
          : undefined,
      rawFile,
      usage: current.usage,
    };
  } catch (e) {
    log(`${label} 오류: ${(e as Error).message}`);
    return { ...base, status: "error", elapsedSec: elapsed(), error: (e as Error).message };
  } finally {
    if (fileId && !opts.keepFiles) await deleteUpstageFile(fileId);
  }
}

async function runPool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  });
  await Promise.all(runners);
  return results;
}

// ---------------------------------------------------------------------------
// 5. 리포트
// ---------------------------------------------------------------------------

const fmt = (v: AnswerValue | null | undefined) =>
  v === null || v === undefined ? "(없음)" : Array.isArray(v) ? JSON.stringify(v) : v;
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function isPass(r: RunResult) {
  return r.status === "completed" && r.keys.every((k) => k.status !== "fail");
}

function buildMarkdown(
  opts: Options,
  sheet: AnswerSheet,
  check: CheckReport,
  results: RunResult[],
  meta: { agentId: string; configId: string; projectId?: string; startedAt: string }
): string {
  const lines: string[] = [];
  const compared = sheet.output_keys.filter((k) => !opts.skipKeys.includes(k));
  lines.push(`# 정답지 대조 리포트`, ``);
  lines.push(`- 실행 시각: ${meta.startedAt}`);
  lines.push(`- 정답지: \`${path.relative(process.cwd(), opts.answer)}\``);
  lines.push(`- 에이전트: \`${meta.agentId}\`, config \`${meta.configId}\`, project \`${meta.projectId ?? "(없음)"}\``);
  lines.push(`- 반복: ${opts.repeat}회, 동시 실행: ${opts.concurrency}, 시간초과 기준: ${opts.timeoutSec}초`);
  lines.push(`- 자동 비교 키: ${compared.join(", ")} / 비교 제외: ${opts.skipKeys.join(", ") || "없음"}`);
  lines.push(``);

  lines.push(`## 사전 점검`, ``);
  for (const m of check.infos) lines.push(`- ℹ️ ${m}`);
  for (const m of check.warnings) lines.push(`- ⚠️ ${m}`);
  for (const m of check.errors) lines.push(`- ❌ ${m}`);
  lines.push(``);

  const pass = results.filter(isPass).length;
  lines.push(`## 요약`, ``, `- 통과 ${pass} / ${results.length}`);
  const bad = results.filter((r) => r.status !== "completed" && r.status !== "skipped");
  if (bad.length) lines.push(`- 실패·시간초과·오류 ${bad.length}건`);
  const times = results.filter((r) => r.status === "completed").map((r) => r.elapsedSec);
  if (times.length) lines.push(`- 소요 시간: 최소 ${Math.min(...times)}초, 최대 ${Math.max(...times)}초`);
  lines.push(``);

  lines.push(`| case | run | 상태 | ${compared.join(" | ")} | 시간 |`);
  lines.push(`|---|---|---|${compared.map(() => "---").join("|")}|---|`);
  for (const r of results) {
    const marks = compared.map((k) => {
      const kr = r.keys.find((x) => x.key === k);
      return !kr ? "-" : kr.status === "pass" ? "✅" : "❌";
    });
    const st = r.status === "completed" ? (isPass(r) ? "통과" : "불일치") : r.status;
    lines.push(`| ${r.caseId} | ${r.run} | ${st} | ${marks.join(" | ")} | ${r.elapsedSec}s |`);
  }
  lines.push(``);

  if (opts.repeat > 1) {
    lines.push(`## 재현성 (같은 케이스 반복 실행 결과 비교)`, ``);
    const byCase = new Map<string, RunResult[]>();
    for (const r of results) byCase.set(r.caseId, [...(byCase.get(r.caseId) ?? []), r]);
    for (const [id, runs] of byCase) {
      const diffs = compared.filter((k) => {
        const vals = runs.map((r) => fmt(r.keys.find((x) => x.key === k)?.actual));
        return new Set(vals).size > 1;
      });
      lines.push(`- ${id}: ${diffs.length ? `❌ 실행마다 다른 키: ${diffs.join(", ")}` : "✅ 모든 실행 결과 동일"}`);
    }
    lines.push(``);
  }

  lines.push(`## 케이스별 상세`, ``);
  for (const r of results) {
    lines.push(`### ${r.caseId} (run ${r.run}) — \`${r.file}\``, ``);
    if (r.status !== "completed") {
      lines.push(`- 상태: **${r.status}** ${r.error ? `— ${r.error}` : ""}`);
      if (r.rawFile) lines.push(`- 원본 응답: \`${path.relative(process.cwd(), r.rawFile)}\``);
      lines.push(``);
      continue;
    }
    lines.push(`| 키 | 결과 | 정답 | 실제 출력 | 비고 |`, `|---|---|---|---|---|`);
    for (const k of r.keys) {
      const mark = k.status === "pass" ? "✅" : k.status === "fail" ? "❌" : "➖ 비교 제외";
      lines.push(`| ${k.key} | ${mark} | ${cell(fmt(k.expected))} | ${cell(fmt(k.actual))} | ${cell(k.note ?? "")} |`);
    }
    lines.push(``);
    if (r.usage) lines.push(`- 토큰: ${r.usage.total_tokens}`);
    if (r.jobId) lines.push(`- job: \`${r.jobId}\``);
    if (r.rawFile) lines.push(`- 원본 응답: \`${path.relative(process.cwd(), r.rawFile)}\``);
    lines.push(``);
  }
  return lines.join("\n");
}

function printCheck(check: CheckReport) {
  console.log("\n== 사전 점검");
  for (const m of check.infos) console.log(`  ℹ️  ${m}`);
  for (const m of check.warnings) console.log(`  ⚠️  ${m}`);
  for (const m of check.errors) console.log(`  ❌ ${m}`);
  if (!check.warnings.length && !check.errors.length) console.log("  ✅ 문제 없음");
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function loadEnv() {
  // Next.js와 같은 우선순위: .env.local이 .env보다 우선한다. 이미 설정된 환경 변수는 덮어쓰지 않는다.
  for (const f of [".env.local", ".env"]) {
    if (fs.existsSync(f)) process.loadEnvFile(f);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { sheet, report: check } = precheck(opts);
  printCheck(check);

  if (!sheet || check.errors.length) {
    console.log("\n사전 점검 오류가 있어 실행하지 않습니다.");
    process.exit(2);
  }
  if (opts.checkOnly) {
    console.log("\n--check-only: API 실행 없이 종료합니다.");
    process.exit(0);
  }

  loadEnv();
  if (opts.config) process.env.UPSTAGE_CONFIG_ID = opts.config;
  let cfg: ReturnType<typeof getUpstageConfig>;
  try {
    cfg = getUpstageConfig();
  } catch (e) {
    fail(`${(e as Error).message}\n키는 .env 또는 터미널에서 직접 설정하세요. 예: export UPSTAGE_API_KEY=up_...`);
  }
  if (!cfg.projectId) {
    console.log("  ⚠️  UPSTAGE_PROJECT_ID가 없습니다. Project 소속 에이전트는 파일을 사용할 수 없을 수 있습니다.");
  }

  let targets = sheet.cases;
  if (opts.cases) {
    const unknown = opts.cases.filter((id) => !sheet.cases.some((c) => c.case_id === id));
    if (unknown.length) fail(`정답지에 없는 case_id: ${unknown.join(", ")}`);
    targets = sheet.cases.filter((c) => opts.cases!.includes(c.case_id));
  }

  const jobs: { c: AnswerCase; run: number }[] = [];
  const skipped: RunResult[] = [];
  for (const c of targets) {
    if (Array.isArray(c.file)) {
      skipped.push({
        caseId: c.case_id,
        file: c.file.join(", "),
        run: 1,
        status: "skipped",
        elapsedSec: 0,
        error: "파일이 여러 개인 케이스는 API로 실행할 수 없음",
        keys: [],
      });
      continue;
    }
    for (let run = 1; run <= opts.repeat; run++) jobs.push({ c, run });
  }

  const startedAt = new Date().toISOString();
  console.log(
    `\n== 실행: ${jobs.length}건 (케이스 ${targets.length}개 × ${opts.repeat}회), 동시 ${opts.concurrency}건, agent ${cfg.agentId} / config ${cfg.configId}`
  );
  fs.mkdirSync(opts.out, { recursive: true });

  const results = [
    ...(await runPool(jobs, opts.concurrency, ({ c, run }) => runCase(c, run, sheet, opts))),
    ...skipped,
  ];

  const md = buildMarkdown(opts, sheet, check, results, {
    agentId: cfg.agentId,
    configId: cfg.configId,
    projectId: cfg.projectId,
    startedAt,
  });
  fs.writeFileSync(path.join(opts.out, "summary.md"), md);
  fs.writeFileSync(
    path.join(opts.out, "results.json"),
    JSON.stringify({ startedAt, agentId: cfg.agentId, configId: cfg.configId, options: opts, precheck: check, results }, null, 2)
  );

  console.log("\n== 결과");
  for (const r of results) {
    const head = `  ${r.caseId}#${r.run} ${String(r.elapsedSec).padStart(4)}s`;
    if (r.status !== "completed") {
      console.log(`${head} ⛔ ${r.status}${r.error ? ` — ${r.error}` : ""}`);
      continue;
    }
    const fails = r.keys.filter((k) => k.status === "fail");
    console.log(`${head} ${fails.length ? "❌" : "✅"}`);
    for (const k of fails) {
      console.log(`      ${k.key}: 정답 ${fmt(k.expected)}`);
      console.log(`      ${" ".repeat(k.key.length)}  출력 ${fmt(k.actual)}${k.note ? `  (${k.note})` : ""}`);
    }
  }
  const pass = results.filter(isPass).length;
  console.log(`\n통과 ${pass} / ${results.length}`);
  console.log(`리포트: ${path.relative(process.cwd(), path.join(opts.out, "summary.md"))}`);
  process.exit(pass === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
