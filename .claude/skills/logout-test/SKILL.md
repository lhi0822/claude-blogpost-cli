네이버 OAuth 토큰의 저장 → 로드 → 삭제 사이클을 검증하세요.

## 테스트 단계

### 1. 현재 토큰 파일 상태 확인
`~/.naver-blog-cli/tokens.json` 경로를 확인합니다.
- 존재하면: 기존 내용을 백업으로 기록해두세요.
- 없으면: "현재 저장된 토큰 없음" 표시.

### 2. `naverBlog.ts` 구현 상태 확인
`src/services/naverBlog.ts`에서 `saveToken`, `loadToken`, `clearToken`이 구현되어 있는지 확인합니다.
- `throw new Error('Not implemented')`가 있으면 "Phase 4 미완성 — 구현 후 재실행하세요" 출력하고 중단합니다.

### 3. 더미 토큰으로 saveToken 테스트
아래 더미 데이터로 `saveToken`을 호출합니다:
```json
{
  "access_token": "TEST_ACCESS_TOKEN_12345",
  "refresh_token": "TEST_REFRESH_TOKEN_67890",
  "token_type": "bearer",
  "expires_in": 3600
}
```
- `~/.naver-blog-cli/tokens.json`이 생성되면 ✔ 통과

### 4. loadToken 테스트
저장 직후 `loadToken()`을 호출합니다.
- 반환값이 step 3에서 저장한 값과 일치하면 ✔ 통과

### 5. logout 명령 실행
```bash
npm run dev -- logout
```
- "네이버 인증 정보가 삭제되었습니다." 메시지 출력 여부 확인
- `~/.naver-blog-cli/tokens.json` 파일이 삭제되었는지 확인
- 삭제 확인되면 ✔ 통과

### 6. loadToken 재호출 (삭제 후)
`clearToken()` 이후 `loadToken()`을 다시 호출합니다.
- `null` 반환이면 ✔ 통과

## 결과 출력 형식

```
[LOGOUT TEST] OAuth 토큰 사이클 검증
─────────────────────────────────
✔ saveToken  — tokens.json 생성 확인
✔ loadToken  — 저장된 값 정상 로드
✔ logout     — CLI 명령 실행 성공
✔ clearToken — tokens.json 삭제 확인
✔ loadToken  — 삭제 후 null 반환 확인
─────────────────────────────────
OAuth 토큰 사이클 정상 동작
```

## 주의

- 실제 저장된 토큰이 있었다면 테스트 후 복원 여부를 사용자에게 묻습니다.
- 실제 네이버 OAuth 인증(브라우저 오픈)은 이 테스트에서 수행하지 않습니다.
