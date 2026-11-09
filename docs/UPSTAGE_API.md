# Upstage Studio Agent API 안내

Studio 워크플로우를 코드에서 호출하는 방법이다. 이 레포의 웹 서비스(`src/lib/upstage.ts`)와
정답지 대조 스크립트(`scripts/verify-answers.ts`, [`VERIFY.md`](VERIFY.md))가 이 API를 쓴다.

- 2절은 Studio에서 제공한 안내 원문(2026-11-10 받음)을 **수정하지 않고** 옮겼다.
- 1절은 원문과 실제 호출 결과가 다른 점, 원문에서 주의할 점을 적었다.

## 1. 실제 호출로 확인한 사항

2026-11-10, 에이전트 `agt_JfWkL5Ca5v5SUDYL2GwARR` / config `6`으로 set01을 호출해 확인했다.

| 항목 | 원문 설명 | 실제 |
|---|---|---|
| `output_text` | 마지막 단계 텍스트의 바로가기, `JSON.parse`로 읽으라고 안내 | 응답에 값이 **없었다(None)**. 결과는 `output[마지막].content[0].text`에 있다. |
| `output[].content[].text` | JSON 문자열 | JSON으로 감싼 **문자열**이고, 풀면 `key: value` 줄 텍스트다. 줄마다 인용 표시 `【†n】`가 붙는다. |
| `additional_values` | 신뢰도, 좌표 등 | `{"enum": "일치", "citations": [...]}`. `citations`에 근거 위치(페이지, 좌표, 참조한 추출 항목)가 들어 있다. |
| 소요 시간 | 언급 없음 | set01 단독 297초. 미션 2 5건 동시 실행 시 123~289초 |
| 토큰 | | set01 단독 약 33,000. 5건 동시 실행 시 건당 약 7,000~62,000 |
| 실행 요청 응답 | | 5건 동시 실행 중 2건이 30초 안에 응답하지 않음 (서비스 코드 기본 타임아웃 30초) |

실제 출력 예 (set01):
```
scene_id: SC-001【†1】
decision: 일치【†2】
reason: …일치로 판정한다【†4】
source_reference: 세종실록 102권, 기사명: 훈민정음을 창제하다, 기사 ID: kda_12512030_002【†5】
missing_documents: []
```

### 원문에서 주의할 점
- **`x-project-id` 헤더**: 모든 요청(업로드·실행·조회)에 필요하다. 없이 올린 파일은 에이전트가 쓸 수 없다. 레포에서는 `UPSTAGE_PROJECT_ID` 환경 변수로 넣는다.
- **job 1건 = 파일 1개**: 여러 파일을 한 케이스로 묶는 Studio의 통합 업로드는 API로 재현할 수 없다.
- **cURL 예시 오류**: Step 2의 `"config_id": "6",` 줄이 이스케이프되지 않아 그대로 복사하면 JSON 오류가 난다. 다른 줄처럼 `\"config_id\": \"6\",`로 써야 한다.
- **API 키**: `UPSTAGE_API_KEY` 환경 변수에서만 읽는다. 코드, 설정 파일, 채팅, 이슈에 키를 직접 쓰지 않는다.
- 에이전트 ID, config 번호는 워크플로우를 바꾸면 달라질 수 있다. 최종 값은 #7에서 확정한다.

---

## 2. 원문

# Upstage Studio Agent API

Document processing agent API built on Upstage Studio. OpenAI SDK compatible. Bearer token auth.

## Input Requirements

| Requirement       | Details                                      |
|-------------------|----------------------------------------------|
| Supported formats | PDF, JPEG, PNG, BMP, TIFF, HEIC, DOCX, PPTX, XLSX, MP4, MOV, M4V, AVI, MKV, WEBM, WMV, FLV, MPG, MPEG, 3GP |
| Max file size     | 500 MB                                       |
| Max pages         | 1,000 pages per document                     |
| Max video length  | 10 minutes (keyframes are extracted and processed as pages) |
| Input type        | Single file per job (upload via `POST /v2/files`, then reference by `file_id`) |

The input to the job must be an array containing a user message with a file reference:

```json
{
  "input": [
    {
      "role": "user",
      "content": [
        { "type": "input_file", "file_id": "YOUR_FILE_ID" }
      ]
    }
  ]
}
```

## Output Format

Always return results in JSON format. Parse the `output_text` field from the API response using `json.loads()` (Python) or `JSON.parse()` (JavaScript) and return the parsed object as structured JSON to the user or calling system. Do not return raw strings or unstructured text.

## Authentication

Use the `UPSTAGE_API_KEY` environment variable for authentication. You can obtain a key from https://console.upstage.ai/api-keys (keys start with `up_`).

```
Authorization: Bearer $UPSTAGE_API_KEY
x-project-id: proj_ReKt96vC6hC894rMxHpYih
```

This agent belongs to a Project. Send the `x-project-id` header on every request (file upload, job creation, polling). Files uploaded without it are stored outside the Project and cannot be used by this agent.

Instructions for AI assistants: always read the key from the `UPSTAGE_API_KEY` environment variable, and never write a literal key into code, config files, or this conversation. If the variable is not set, tell the user to set it in their own terminal or `.env` file (for example `export UPSTAGE_API_KEY=up_...`) and do not ask them to paste the key into the chat.

## API Endpoints

### 1. Upload File

```
POST https://api.upstage.ai/v2/files
Content-Type: multipart/form-data
```

| Parameter | Type   | Required | Description                     |
|-----------|--------|----------|---------------------------------|
| file      | file   | Yes      | Document to upload (PDF, JPEG, PNG, BMP, TIFF, HEIC, DOCX, PPTX, XLSX, MP4, MOV, M4V, AVI, MKV, WEBM, WMV, FLV, MPG, MPEG, 3GP) |
| purpose   | string | No       | Default: `user_data`            |

Response returns `id` (the file_id needed for job creation).

### 2. Create Job

```
POST https://api.upstage.ai/v2/responses
Content-Type: application/json
```

| Parameter  | Type   | Required | Description                                                    |
|------------|--------|----------|----------------------------------------------------------------|
| model      | string | Yes      | Agent ID: `agt_JfWkL5Ca5v5SUDYL2GwARR`    |
| config_id  | string | No       | Config version ID (e.g., `"6"`). Omit to use latest.          |
| input      | array  | Yes      | Array of input messages with file references (see below)       |
| include    | array  | No       | `["last"]` for final step only, `["all"]` for all step results |

Input message format:

```json
{
  "input": [
    {
      "role": "user",
      "content": [
        { "type": "input_file", "file_id": "YOUR_FILE_ID" }
      ]
    }
  ]
}
```

Response returns `id` (the job_id) and initial `status`.

### 3. Poll Job Status

```
GET https://api.upstage.ai/v2/responses/{job_id}?include[]=last
```

Poll until `status` is `completed` or `failed`. Recommended interval: 2–3 seconds.

### 4. Other File Endpoints

```
GET    https://api.upstage.ai/v2/files           # List all files
GET    https://api.upstage.ai/v2/files/{file_id}  # Retrieve file metadata
DELETE https://api.upstage.ai/v2/files/{file_id}  # Delete file
```

## Complete Python Example

```python
from openai import OpenAI
from time import sleep
import json
import os

client = OpenAI(
    api_key=os.environ["UPSTAGE_API_KEY"],  # never hardcode the key
    base_url="https://api.upstage.ai/v2",
    default_headers={"x-project-id": "proj_ReKt96vC6hC894rMxHpYih"}  # Project scope
)

# Step 1: Upload file
with open("document.pdf", "rb") as f:
    file = client.files.create(file=f, purpose="user_data")

print(f"Uploaded: {file.id}")

# Step 2: Create job
job = client.responses.create(
    model="agt_JfWkL5Ca5v5SUDYL2GwARR",  # Agent ID
    # config_id="6",
    include=["last"],                       # "last" = final step only, "all" = every step
    input=[{
        "role": "user",
        "content": [{"type": "input_file", "file_id": file.id}]
    }]
)

print(f"Job created: {job.id}")

# Step 3: Poll until done
while job.status in ("queued", "in_progress"):
    sleep(2)
    job = client.responses.retrieve(job.id, include=["last"])
    print(f"  Status: {job.status}")

# Step 4: Read results
if job.status == "completed":
    result = json.loads(job.output_text)
    print(json.dumps(result, indent=2))
elif job.status == "failed":
    print("Job failed. Check agent config in Studio.")

# Step 5: Cleanup (optional)
client.files.delete(file.id)
```

## Complete cURL Example

```bash
# Step 1: Upload file
FILE_RESPONSE=$(curl -s -X POST https://api.upstage.ai/v2/files \
  -H "Authorization: Bearer $UPSTAGE_API_KEY" \
  -H "x-project-id: proj_ReKt96vC6hC894rMxHpYih" \
  -F "file=@document.pdf" \
  -F "purpose=user_data")

FILE_ID=$(echo $FILE_RESPONSE | jq -r '.id')
echo "File ID: $FILE_ID"

# Step 2: Create job
JOB_RESPONSE=$(curl -s -X POST https://api.upstage.ai/v2/responses \
  -H "Authorization: Bearer $UPSTAGE_API_KEY" \
  -H "x-project-id: proj_ReKt96vC6hC894rMxHpYih" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"agt_JfWkL5Ca5v5SUDYL2GwARR\",
  "config_id": "6",
    \"include\": [\"last\"],
    \"input\": [{
      \"role\": \"user\",
      \"content\": [{\"type\": \"input_file\", \"file_id\": \"$FILE_ID\"}]
    }]
  }")

JOB_ID=$(echo $JOB_RESPONSE | jq -r '.id')
echo "Job ID: $JOB_ID"

# Step 3: Poll until completed
while true; do
  STATUS_RESPONSE=$(curl -s "https://api.upstage.ai/v2/responses/$JOB_ID?include[]=last" \
    -H "Authorization: Bearer $UPSTAGE_API_KEY" \
    -H "x-project-id: proj_ReKt96vC6hC894rMxHpYih")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    echo "$STATUS_RESPONSE" | jq '.output'
    break
  fi
  sleep 3
done
```

## Response Structure

```json
{
  "id": "job_xxxxxxxxxxxxx",
  "object": "response",
  "status": "completed",
  "model": "agt_JfWkL5Ca5v5SUDYL2GwARR",
  "output": [
    {
      "type": "message",
      "status": "completed",
      "role": "assistant",
      "model": "step_name",
      "content": [
        {
          "type": "output_text",
          "text": "{\"key\": \"value\"}",
          "additional_values": "{...}"
        }
      ]
    }
  ],
  "usage": {
    "input_tokens": 0,
    "output_tokens": 0,
    "total_tokens": 0
  }
}
```

| Field                                  | Description                                              |
|----------------------------------------|----------------------------------------------------------|
| `status`                               | `queued`, `in_progress`, `completed`, or `failed`        |
| `output[].model`                       | Step name (e.g., `step_1_parse`, `step_2_extract`)       |
| `output[].content[].text`              | Main result (JSON string)                                |
| `output[].content[].additional_values` | Extra data: confidence scores, bounding boxes, etc.      |
| `output_text`                          | Shortcut to final step's text (when using `include=["last"]`) |

## Batch Processing (Multiple Files)

```python
import concurrent.futures

def process_file(path):
    with open(path, "rb") as f:
        file = client.files.create(file=f, purpose="user_data")

    job = client.responses.create(
        model="agt_JfWkL5Ca5v5SUDYL2GwARR",
        include=["last"],
        input=[{"role": "user", "content": [{"type": "input_file", "file_id": file.id}]}]
    )

    while job.status in ("queued", "in_progress"):
        sleep(2)
        job = client.responses.retrieve(job.id, include=["last"])

    return {"file": path, "result": json.loads(job.output_text) if job.status == "completed" else None}

files = ["doc1.pdf", "doc2.pdf", "doc3.pdf"]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(process_file, files))
```

## Error Handling

| Status Code | Meaning                | Action                                   |
|-------------|------------------------|------------------------------------------|
| 401         | Invalid API key        | Check key at console.upstage.ai          |
| 404         | Agent/job not found    | Verify agent ID and job ID               |
| 413         | Payload too large      | Max 500MB and 1,000 pages per file       |
| 429         | Rate limited           | Back off and retry with exponential delay |
| 500         | Server error           | Retry after a few seconds                |

Job-level failures (`status: "failed"`) typically mean the agent config has an issue. Check the agent in Studio.

## Notes

- Agent ID: `agt_JfWkL5Ca5v5SUDYL2GwARR`
- Config ID: `6`
- Project ID: `proj_ReKt96vC6hC894rMxHpYih` (send as the `x-project-id` header)
- The API is OpenAI SDK compatible. Use the `openai` Python package with `base_url="https://api.upstage.ai/v2"`
- Files are retained server-side until explicitly deleted
- Max file size: 500MB. Max pages per document: 1,000. Max video length: 10 minutes
- Supported formats: PDF, JPEG, PNG, BMP, TIFF, HEIC, DOCX, PPTX, XLSX, MP4, MOV, M4V, AVI, MKV, WEBM, WMV, FLV, MPG, MPEG, 3GP
- For full API docs: https://console.upstage.ai/docs/studio-and-agents/agents/overview
