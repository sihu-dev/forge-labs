# 🔐 Google OAuth 403 에러 해결 가이드

## 문제 상황
OAuth 인증 URL을 클릭했을 때 403 에러가 발생합니다.

## 원인
`credentials.json` 파일의 redirect URI와 Google Cloud Console에 설정된 redirect URI가 일치하지 않아서 발생합니다.

현재 `credentials.json`의 redirect URI: `http://localhost`

---

## 해결 방법

### 옵션 1: Google Cloud Console에서 redirect URI 추가 (권장)

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택: **hyeinagent**
3. **API 및 서비스** → **사용자 인증 정보** 메뉴로 이동
4. OAuth 2.0 클라이언트 ID 목록에서 해당 클라이언트 클릭
5. **승인된 리디렉션 URI** 섹션에서 다음 URI들을 추가:
   ```
   http://localhost
   http://localhost:3000/oauth2callback
   http://localhost/oauth2callback
   ```
6. **저장** 클릭
7. 다시 OAuth 스크립트 실행

### 옵션 2: 새로운 credentials.json 다운로드

Google Cloud Console에서 redirect URI 설정을 변경한 후:

1. OAuth 2.0 클라이언트 ID 상세 페이지에서 **JSON 다운로드** 클릭
2. 다운로드된 파일을 프로젝트 루트의 `credentials.json`으로 교체
3. 다시 OAuth 스크립트 실행

---

## 단계별 실행

### 1단계: Google Cloud Console 설정 확인

현재 설정된 redirect URI를 확인하세요:
- [Google Cloud Console - 사용자 인증 정보](https://console.cloud.google.com/apis/credentials?project=hyeinagent)

### 2단계: OAuth 스크립트 재실행

Google Cloud Console 설정 변경 후:

```bash
npm run oauth:google
```

또는

```bash
npx tsx scripts/google-oauth.ts
```

### 3단계: 브라우저에서 인증

1. 생성된 URL을 브라우저에서 열기
2. Google 계정으로 로그인
3. 권한 승인
4. **중요:** 브라우저 주소창에 표시되는 전체 URL을 복사
   - 성공 시: `http://localhost/?code=4/0AanRR...` 형태
   - 실패 시: 403 에러 페이지
5. URL에서 `code=` 뒤의 코드만 복사
6. 터미널에 코드 붙여넣기

### 4단계: 토큰 생성 확인

성공하면 다음과 같이 출력됩니다:
```
✅ 토큰이 token.json 파일에 저장되었습니다.

🔑 Refresh Token:
1//0abc...xyz

이 Refresh Token을 .env 파일의 GOOGLE_REFRESH_TOKEN에 추가하세요.
```

---

## 자주 발생하는 오류

### 1. 403: access_denied

**원인:** Redirect URI 불일치

**해결:**
- Google Cloud Console에서 `http://localhost` 추가
- 브라우저 시크릿 모드로 재시도
- Google 계정이 프로젝트 테스트 사용자로 등록되어 있는지 확인

### 2. 400: redirect_uri_mismatch

**원인:** credentials.json의 redirect URI가 Google Cloud Console 설정과 다름

**해결:**
- Google Cloud Console에서 정확히 동일한 URI 추가
- 대소문자, 슬래시(/) 포함 여부까지 정확히 일치해야 함

### 3. 앱이 확인되지 않음 경고

**원인:** OAuth 동의 화면이 "테스트" 모드

**해결:**
- "고급" 클릭 → "안전하지 않은 페이지로 이동" 클릭
- 개발 환경에서는 정상적인 경고입니다

---

## OAuth 동의 화면 설정 확인

만약 OAuth 동의 화면이 설정되지 않았다면:

1. [OAuth 동의 화면](https://console.cloud.google.com/apis/credentials/consent?project=hyeinagent) 접속
2. **User Type**: 외부 선택
3. **앱 이름**: Hyein Agent
4. **사용자 지원 이메일**: 본인 이메일
5. **개발자 연락처 정보**: 본인 이메일
6. **범위**:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/calendar`
7. **테스트 사용자**: 본인 Google 계정 추가
8. 저장

---

## 테스트 명령어

### OAuth 인증 테스트
```bash
npm run oauth:google
```

### Google Services 연결 테스트 (OAuth 완료 후)
```bash
npm run google
```

### 전체 파이프라인 실행 (OAuth 완료 후)
```bash
npm run pipeline
```

---

## 성공 후 다음 단계

OAuth 인증이 성공하면:

1. `.env` 파일 업데이트:
   ```env
   GOOGLE_REFRESH_TOKEN=1//0abc...xyz
   GOOGLE_SHEETS_ENABLED=true
   GOOGLE_CALENDAR_ENABLED=true
   ```

2. Google Services 테스트:
   ```bash
   npm run google
   ```

3. 전체 파이프라인 테스트:
   ```bash
   npm run pipeline
   ```

---

## 문제가 계속되면

1. Google Cloud Console에서 OAuth 클라이언트 ID를 새로 생성
2. 애플리케이션 유형: **데스크톱 앱** 선택 (웹 애플리케이션 대신)
3. 새로운 credentials.json 다운로드
4. 프로젝트 루트에 복사
5. 다시 OAuth 스크립트 실행

---

## 참고 링크

- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 설정 가이드](https://developers.google.com/identity/protocols/oauth2)
- [Sheets API 문서](https://developers.google.com/sheets/api)
- [Calendar API 문서](https://developers.google.com/calendar/api)
