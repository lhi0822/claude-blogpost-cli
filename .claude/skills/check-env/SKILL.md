`.env` 파일의 API 키 5개를 실제 호출로 유효성 검사하세요.

## 검사 항목

### 1. .env 파일 존재 확인
- `.env` 파일이 없으면 "`.env` 파일이 없습니다. `.env.example`을 복사해 설정하세요." 출력 후 중단합니다.

### 2. 필수 환경 변수 존재 여부
아래 5개 키가 모두 존재하고 기본값(`your_*`)이 아닌지 확인합니다:
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`
- `NAVER_BLOG_CLIENT_ID`
- `NAVER_BLOG_CLIENT_SECRET`
- `GEMINI_API_KEY`

### 3. 네이버 검색 API 연결 테스트
```
GET https://openapi.naver.com/v1/search/news.json?query=테스트&display=1&sort=date
Headers:
  X-Naver-Client-Id: {NAVER_CLIENT_ID}
  X-Naver-Client-Secret: {NAVER_CLIENT_SECRET}
```
- 200 응답이면 ✔ 통과
- 401/403이면 "Client ID/Secret 오류" 출력

### 4. Gemini API 연결 테스트
`@google/generative-ai` SDK로 `gemini-1.5-flash` 모델에 "ping"이라는 짧은 메시지를 보내 응답을 확인합니다.
- 정상 응답이면 ✔ 통과
- 오류면 API 키 오류 메시지 출력

### 5. 네이버 블로그 OAuth 클라이언트 확인
실제 OAuth 브라우저 인증 없이, 아래 URL이 올바른 파라미터로 구성되는지만 확인합니다:
```
https://nid.naver.com/oauth2.0/authorize
  ?response_type=code
  &client_id={NAVER_BLOG_CLIENT_ID}
  &redirect_uri=http://localhost:3000/callback
  &state=dryrun_check
```
- URL 구성이 정상이면 ✔ 통과 (실제 브라우저 오픈 안 함)

## 결과 출력 형식

```
[ENV CHECK] 환경 변수 유효성 검사
─────────────────────────────────
✔ .env 파일 존재
✔ 필수 키 5개 모두 설정됨
✔ 네이버 검색 API — 연결 성공
✔ Gemini API    — 연결 성공
✔ 네이버 블로그 OAuth URL 구성 — 정상
─────────────────────────────────
모든 검사 통과 — 개발을 시작할 수 있습니다.
```

실패 항목이 있으면 해결 방법을 함께 안내하세요.
