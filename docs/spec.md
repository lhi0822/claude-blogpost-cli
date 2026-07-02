# SPEC - 네이버 뉴스 블로그 포스팅 CLI

## 폴더 구조

```
naver-blog-cli/
├── src/
│   ├── index.ts                  # CLI 진입점, Commander 설정
│   ├── types.ts                  # 공통 TypeScript 인터페이스
│   ├── commands/
│   │   └── post.ts               # 메인 포스팅 플로우 오케스트레이션
│   ├── services/
│   │   ├── naverNews.ts          # 네이버 뉴스 검색 API 클라이언트
│   │   ├── gemini.ts             # Gemini API 분석 및 포스트 생성
│   │   └── naverBlog.ts          # 네이버 OAuth 인증 + 블로그 포스팅
│   └── prompts/
│       └── input.ts              # 터미널 사용자 입력 처리 (키워드, 스타일, y/n)
├── docs/
│   ├── prd.md
│   └── spec.md
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 명령어 명세

### `blog-post` (기본 명령)

메인 실행 흐름. 인자 없이 실행하면 프롬프트로 입력 받음.

```
$ blog-post
```

**실행 단계:**

```
[1] 키워드 입력 프롬프트
    > 키워드를 입력하세요: ___

[2] 스타일 선택 프롬프트
    > 포스트 스타일을 선택하세요:
      [1] 뉴스레터 (뉴스별 요약 리스트)
      [2] 칼럼 (서론-본론-결론 통합 글)

[3] 뉴스 수집 (스피너 표시)
    ⠸ 네이버 뉴스 검색 중...
    ✔ 뉴스 10개 수집 완료

[4] AI 분석 및 포스트 생성 (스피너 표시)
    ⠸ Gemini로 블로그 포스트 생성 중...
    ✔ 포스트 생성 완료

[5] 미리보기 출력
    ─────────────────────────────────
    제목: {생성된 제목}
    태그: {태그1}, {태그2}, {태그3}, {태그4}, {태그5}
    ─────────────────────────────────
    {본문 전체 출력}
    ─────────────────────────────────

[6] 포스팅 확인 프롬프트
    > 포스팅할까요? (y/n): ___
    → n 선택 시 "취소되었습니다." 출력 후 종료

[7] 포스팅 (스피너 표시)
    ⠸ 네이버 블로그에 포스팅 중...
    ✔ 포스팅 완료!

[8] 완료 출력
    제목: {제목}
    태그: {태그1}, {태그2}, ...
    URL:  https://blog.naver.com/{blogId}/{logNo}
```

---

### `blog-post logout`

로컬에 저장된 네이버 OAuth 토큰을 삭제.

```
$ blog-post logout
✔ 네이버 인증 정보가 삭제되었습니다.
```

---

## 로컬 스토리지 스키마

DB 없음. OAuth 토큰만 로컬 파일로 저장.

**저장 경로:**
```
~/.naver-blog-cli/tokens.json
```

**tokens.json 구조:**
```json
{
  "access_token": "AAAAOLtP...",
  "refresh_token": "c8ceMEjf...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `access_token` | string | 네이버 API 호출에 사용하는 토큰 |
| `refresh_token` | string | access_token 만료 시 갱신용 |
| `token_type` | string | 항상 `"bearer"` |
| `expires_in` | number | 만료까지 남은 초 (발급 시점 기준) |

> `logout` 명령 실행 시 이 파일 삭제. 다음 실행 시 OAuth 재인증.

---

## API 명세

### 1. 네이버 뉴스 검색 API

| 항목 | 값 |
|------|-----|
| Method | GET |
| URL | `https://openapi.naver.com/v1/search/news.json` |
| 인증 | Header |

**Request Headers:**
```
X-Naver-Client-Id: {NAVER_CLIENT_ID}
X-Naver-Client-Secret: {NAVER_CLIENT_SECRET}
```

**Query Parameters:**
| 파라미터 | 값 | 설명 |
|---------|-----|------|
| `query` | 사용자 입력 키워드 | 검색어 |
| `display` | `10` | 수집할 뉴스 개수 (고정) |
| `sort` | `date` | 최신순 정렬 |

**Response (사용 필드):**
```json
{
  "items": [
    {
      "title": "뉴스 제목 (HTML 태그 포함)",
      "originallink": "원본 기사 URL",
      "link": "네이버 뉴스 URL",
      "description": "뉴스 요약 (HTML 태그 포함)",
      "pubDate": "Mon, 30 Jun 2026 10:00:00 +0900"
    }
  ]
}
```
> `title`, `description`에서 HTML 태그(`<b>`, `</b>` 등) 제거 후 사용.

---

### 2. 네이버 OAuth 2.0 (블로그 포스팅용)

최초 실행 시 브라우저를 열어 인증. 이후 토큰은 로컬 파일에서 로드.

**Step 1 - 인증 URL로 브라우저 오픈:**
```
https://nid.naver.com/oauth2.0/authorize
  ?response_type=code
  &client_id={NAVER_BLOG_CLIENT_ID}
  &redirect_uri=http://localhost:3000/callback
  &state={random_hex_32자}
```

**Step 2 - 로컬 콜백 서버 (Express, port 3000)로 code 수신**

**Step 3 - Access Token 발급:**

| 항목 | 값 |
|------|-----|
| Method | GET |
| URL | `https://nid.naver.com/oauth2.0/token` |

Query Parameters:
| 파라미터 | 값 |
|---------|-----|
| `grant_type` | `authorization_code` |
| `client_id` | `{NAVER_BLOG_CLIENT_ID}` |
| `client_secret` | `{NAVER_BLOG_CLIENT_SECRET}` |
| `code` | Step 2에서 받은 code |
| `state` | Step 1에서 생성한 state |

**Response → `tokens.json`에 저장.**

---

### 3. 네이버 블로그 포스팅 API

| 항목 | 값 |
|------|-----|
| Method | POST |
| URL | `https://openapi.naver.com/blog/writePost.json` |
| Content-Type | `application/x-www-form-urlencoded` |
| 인증 | `Authorization: Bearer {access_token}` |

**Request Body:**
| 파라미터 | 값 | 설명 |
|---------|-----|------|
| `title` | Gemini 생성 제목 | 블로그 글 제목 |
| `contents` | Gemini 생성 HTML 본문 | 블로그 글 본문 |
| `tags` | 콤마 구분 태그 문자열 | 예: `"인공지능,AI,뉴스"` |
| `publicYn` | `Y` | 전체 공개 (고정) |
| `sendNotification` | `false` | 이웃 알림 OFF (고정) |

**Response (사용 필드):**
```json
{
  "result": {
    "blogId": "myblog",
    "logNo": 12345678
  }
}
```
> 포스팅 URL 조합: `https://blog.naver.com/{blogId}/{logNo}`

---

### 4. Gemini API

| 항목 | 값 |
|------|-----|
| SDK | `@google/generative-ai` |
| Model | `gemini-1.5-flash` (무료 티어: 15 RPM / 1,500 RPD) |

**입력 프롬프트 구조:**

```
키워드: {keyword}
스타일: {뉴스레터 | 칼럼}
뉴스 목록:
  [1] 제목: ...  내용: ...  날짜: ...
  [2] ...
  ...

위 뉴스를 분석하여 블로그 포스트를 작성해주세요.
분량: 1,000~1,500자
반드시 아래 JSON 형식으로만 응답:
{
  "title": "제목 (60자 이내)",
  "content": "HTML 본문 (h2, h3, p, ul, li 태그 사용)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"]
}
```

**Response 파싱:**
- 응답 텍스트에서 `{...}` JSON 추출 (정규식)
- `title`, `content`, `tags` 필드 사용

---

## 타입 정의 (`src/types.ts`)

```typescript
export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

export interface BlogPost {
  title: string;
  content: string;  // HTML
  tags: string[];   // 5개
}

export type PostStyle = 'newsletter' | 'column';

export interface NaverToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
```
