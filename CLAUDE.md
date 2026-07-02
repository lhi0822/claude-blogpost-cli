# CLAUDE.md — naver-blog-cli

키워드 입력 → 네이버 뉴스 수집 → Gemini AI 분석 → 네이버 블로그 자동 포스팅 CLI.

---

## 프로젝트 개요

| 항목 | 값 |
|------|-----|
| 실행 명령 | `npm run dev` (개발) / `blog-post` (빌드 후) |
| 빌드 | `npm run build` → `dist/index.js` |
| 언어 | TypeScript + Node.js |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| 뉴스 | 네이버 검색 API |
| 포스팅 | 네이버 블로그 API (OAuth 2.0) |

---

## 폴더 구조

```
src/
├── index.ts              # CLI 진입점 (Commander)
├── types.ts              # 공통 타입 (NewsItem, BlogPost, PostStyle, NaverToken)
├── commands/
│   └── post.ts           # 메인 포스팅 플로우 오케스트레이터
├── services/
│   ├── naverNews.ts      # 네이버 뉴스 검색 API
│   ├── gemini.ts         # Gemini AI 포스트 생성
│   └── naverBlog.ts      # OAuth 인증 + 블로그 포스팅
└── prompts/
    └── input.ts          # 터미널 사용자 입력 (키워드, 스타일, y/n)
```

---

## 실행 흐름

```
키워드 입력 → 스타일 선택 → 뉴스 수집 → AI 생성 → 미리보기 → 확인 → 포스팅 → 완료
```

---

## 개발 계획 (Phase별 체크리스트)

### Phase 1 — 터미널 입력 (`src/prompts/input.ts`)

- [ ] `promptKeyword()` — readline으로 키워드 입력 받기
- [ ] `promptStyle()` — 1/2 선택으로 `newsletter | column` 반환
- [ ] `promptConfirm()` — y/n 입력 받아 boolean 반환

> 의존성 없음. 먼저 완성하면 나머지 테스트가 쉬워짐.

---

### Phase 2 — 네이버 뉴스 수집 (`src/services/naverNews.ts`)

- [ ] `searchNews(keyword, count=10)` 구현
  - GET `https://openapi.naver.com/v1/search/news.json`
  - Headers: `X-Naver-Client-Id`, `X-Naver-Client-Secret`
  - Query: `query`, `display=10`, `sort=date`
  - `title`/`description`에서 HTML 태그(`<b>`, `</b>`) 제거 후 반환
  - 반환 타입: `NewsItem[]`

---

### Phase 3 — Gemini AI 포스트 생성 (`src/services/gemini.ts`)

- [ ] `generateBlogPost(keyword, articles, style)` 구현
  - Model: `gemini-1.5-flash`
  - 프롬프트: 키워드 + 스타일 + 뉴스 목록 조합
  - 응답 형식: JSON `{ title, content (HTML), tags[5] }`
  - 정규식으로 응답 텍스트에서 `{...}` 추출 후 파싱
  - 반환 타입: `BlogPost`

---

### Phase 4 — 네이버 OAuth + 블로그 포스팅 (`src/services/naverBlog.ts`)

- [ ] `loadToken()` — `~/.naver-blog-cli/tokens.json` 로드
- [ ] `saveToken(token)` — 위 경로에 JSON 저장
- [ ] `authenticate()` — OAuth 플로우 구현
  - 브라우저로 `https://nid.naver.com/oauth2.0/authorize` 오픈 (`open` 패키지)
  - Express 서버 (port 3000) 로컬 콜백으로 `code` 수신
  - `https://nid.naver.com/oauth2.0/token`으로 access_token 발급
- [ ] `getAccessToken()` — 저장 토큰 로드, 없으면 `authenticate()` 실행
- [ ] `postToBlog(post)` — 포스팅 후 URL 반환
  - POST `https://openapi.naver.com/blog/writePost.json`
  - Body: `title`, `contents`, `tags` (콤마 구분), `publicYn=Y`, `sendNotification=false`
  - 반환: `https://blog.naver.com/{blogId}/{logNo}`
- [ ] `clearToken()` — `tokens.json` 파일 삭제

---

### Phase 5 — 메인 플로우 연결 (`src/commands/post.ts`)

- [ ] `runPostCommand()` 구현 — 전체 8단계 오케스트레이션
  1. `promptKeyword()` 호출
  2. `promptStyle()` 호출
  3. `searchNews()` 호출 (ora 스피너)
  4. `generateBlogPost()` 호출 (ora 스피너)
  5. 미리보기 출력 (제목 / 태그 / 본문)
  6. `promptConfirm()` → n이면 종료
  7. `postToBlog()` 호출 (ora 스피너)
  8. 완료 출력 (제목 / 태그 / URL)

---

### Phase 6 — 마무리 및 빌드 검증

- [ ] `blog-post logout` 명령 동작 확인 (`clearToken` 연결)
- [ ] `.env.example` 기준으로 환경 변수 누락 시 에러 메시지 처리
- [ ] `npm run build` 성공 확인 (`tsup` → `dist/index.js`)
- [ ] `node dist/index.js` 로 E2E 실행 검증

---

## 환경 변수 (`.env`)

```
NAVER_CLIENT_ID=          # 네이버 검색 API
NAVER_CLIENT_SECRET=      # 네이버 검색 API
NAVER_BLOG_CLIENT_ID=     # 네이버 블로그 OAuth
NAVER_BLOG_CLIENT_SECRET= # 네이버 블로그 OAuth
GEMINI_API_KEY=           # Google AI Studio
```

---

## Custom Skills (슬래시 커맨드)

| 커맨드 | 용도 | 언제 사용 |
|--------|------|-----------|
| `/dry-run [keyword]` | 포스팅 없이 뉴스 수집→AI 생성→미리보기만 실행 | Phase 3~4 개발 중 빠른 검증 |
| `/check-env` | API 키 5개 실제 호출로 유효성 검사 | 개발 시작 전, 인증 오류 발생 시 |
| `/logout-test` | 토큰 저장→로드→삭제 사이클 검증 | Phase 4 완료 후 |

## Sub-Agents

| 에이전트 | 역할 | 언제 사용 |
|----------|------|-----------|
| `prompt-tuner` | Gemini 프롬프트 품질 평가 및 `gemini.ts` 개선 | `/dry-run` 결과 품질이 불만족스러울 때 |
| `oauth-debugger` | 네이버 OAuth 플로우 트러블슈팅 및 `naverBlog.ts` 수정 | Phase 4 구현 중 인증 오류 발생 시 |

---

## 참고 문서

- PRD: `docs/prd.md`
- SPEC (API 명세 포함): `docs/spec.md`
