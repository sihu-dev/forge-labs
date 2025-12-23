# 🚀 Ultimate 개발 환경 완벽 세팅 가이드

> 초보자부터 전문가까지 - 최상의 개발 도구 All-in-One 가이드

---

## 📋 목차

1. [개요](#개요)
2. [VSCode 확장 프로그램](#vscode-확장-프로그램)
3. [MCP (Model Context Protocol)](#mcp-model-context-protocol)
4. [AI 코딩 도우미](#ai-코딩-도우미)
5. [필수 개발 도구](#필수-개발-도구)
6. [최적 세팅 가이드](#최적-세팅-가이드)
7. [워크플로우 추천](#워크플로우-추천)

---

## 개요

### ✅ 설치 완료된 항목

#### VSCode 확장 프로그램: **35개**
- 기본 필수 도구: 27개 ✅
- AI 코딩 도우미: 3개 ✅
- 생산성 도구: 4개 ✅
- 추가 유틸리티: 1개 ✅

#### 설정 파일
- ✅ `.vscode/` - 완벽한 VSCode 설정
- ✅ `.mcp/` - MCP 서버 설정
- ✅ `.continue/` - Continue AI 설정
- ✅ `.env` - 환경 변수

#### 문서
- ✅ VSCode 초보자 가이드
- ✅ GitKraken 사용법
- ✅ MCP 설정 가이드
- ✅ 이 통합 가이드!

---

## VSCode 확장 프로그램

### 🔥 필수 확장 (기본 설치됨)

#### 개발 도구
```
✅ ESLint - 코드 품질 검사
✅ Prettier - 자동 포맷팅
✅ Error Lens - 인라인 에러 표시
✅ Code Spell Checker - 맞춤법 검사
```

#### Git 도구
```
✅ GitLens - Git 슈퍼파워 (최고!)
✅ Git Graph - 시각적 히스토리
```

#### AI 코딩 도우미 (새로 추가!)
```
✅ Continue - MCP 지원 AI 도우미 ⭐
✅ Tabnine - AI 자동완성
✅ GitHub Copilot - AI 코드 생성 (유료)
✅ GitHub Copilot Chat - AI 채팅
✅ IntelliCode - AI 추천
✅ IntelliCode Completions - 자동완성 강화
```

#### 생산성 도구 (새로 추가!)
```
✅ TODO Tree - TODO 관리
✅ TODO Highlight - TODO 하이라이팅
✅ Bookmarks - 코드 북마크
✅ Command Runner - 명령어 실행
✅ Live Server - 라이브 리로드 서버
✅ Path Intellisense - 경로 자동완성
✅ Import Cost - 패키지 크기 표시
```

#### 테마 & 아이콘
```
✅ Material Icon Theme - 파일 아이콘
✅ One Dark Pro - 다크 테마
✅ Better Comments - 주석 색상
```

#### 파일 포맷 지원
```
✅ Markdown All in One - 마크다운
✅ Rainbow CSV - CSV 하이라이팅
✅ YAML - YAML 지원
✅ REST Client - API 테스트
```

---

## MCP (Model Context Protocol)

### 🎯 설정 완료

MCP는 AI 모델이 외부 도구와 데이터에 접근할 수 있게 해주는 표준 프로토콜입니다.

**설정 파일**: [.mcp/config.json](../.mcp/config.json)

### 활성화된 MCP 서버

#### 1. **Filesystem Server** ✅
```
기능: 파일 시스템 접근
용도: AI가 프로젝트 파일 읽기/쓰기
```

#### 2. **GitHub Server** ✅
```
기능: GitHub 연동
용도: Issue, PR 생성 및 관리
설정 필요: GITHUB_TOKEN
```

#### 3. **Memory Server** ✅
```
기능: 컨텍스트 유지
용도: 이전 대화 기억
```

### 선택적 서버 (필요시 활성화)

#### 4. **Puppeteer** (비활성화)
```
기능: 웹 스크래핑
용도: 웹페이지 크롤링, 스크린샷
```

#### 5. **PostgreSQL** (비활성화)
```
기능: 데이터베이스 접근
용도: SQL 쿼리 실행
설정 필요: DATABASE_URL
```

### 📚 자세한 가이드
👉 [MCP_SETUP_GUIDE.md](MCP_SETUP_GUIDE.md)

---

## AI 코딩 도우미

### 1️⃣ Continue (⭐ 추천!)

**특징:**
- ✅ **MCP 지원** - 파일 시스템, GitHub 등 통합
- ✅ **Claude API 지원** - Sonnet 4.5 사용 가능
- ✅ **무료** - API 키만 있으면 OK
- ✅ **커스터마이징** - 자유로운 설정

**설정 파일**: [.continue/config.json](../.continue/config.json)

**사용법:**
```
1. Ctrl+L - Continue 채팅 열기
2. 코드 선택 후 Ctrl+L - 선택한 코드에 대해 질문
3. /edit - 코드 편집 모드
4. /test - 테스트 코드 생성
5. /docs - 문서화 주석 생성
```

**커스텀 명령어:**
- `/test` - Jest 테스트 생성
- `/docs` - JSDoc 주석 생성
- `/refactor` - 코드 리팩토링
- `/explain` - 코드 설명
- `/fix` - 버그 수정
- `/optimize` - 성능 최적화

---

### 2️⃣ Tabnine

**특징:**
- ✅ **AI 자동완성** - 코드 작성 중 실시간 제안
- ✅ **빠른 응답** - 로컬 모델 사용
- ✅ **무료 버전** - 기본 기능 사용 가능

**사용법:**
```
코드 작성 중 자동으로 제안됨
Tab 키로 수락
```

---

### 3️⃣ GitHub Copilot (유료)

**특징:**
- ✅ **강력한 AI** - OpenAI GPT 기반
- ✅ **코드 생성** - 주석만 작성하면 코드 자동 생성
- ✅ **학생/오픈소스 무료** - 조건부 무료

**가격:**
- 개인: $10/월
- 학생/교육자: 무료
- 오픈소스 메인테이너: 무료

---

### 4️⃣ IntelliCode

**특징:**
- ✅ **무료** - Microsoft 제공
- ✅ **컨텍스트 기반** - 코드 패턴 학습
- ✅ **가벼움** - 빠른 응답

---

### 🆚 비교표

| 도구 | 가격 | MCP | 강점 | 단점 |
|------|------|-----|------|------|
| **Continue** | 무료 | ✅ | MCP, 커스터마이징 | 설정 필요 |
| **Tabnine** | 무료/유료 | ❌ | 빠름, 로컬 | 제한적 |
| **Copilot** | $10/월 | ❌ | 강력함 | 유료 |
| **IntelliCode** | 무료 | ❌ | MS 통합 | 기본적 |

### 💡 추천 조합

**무료 최강 조합:**
```
Continue (채팅) + Tabnine (자동완성) + IntelliCode (추천)
```

**유료 최강 조합:**
```
Continue (채팅) + GitHub Copilot (자동완성) + IntelliCode (추천)
```

---

## 필수 개발 도구

### 1️⃣ Git 클라이언트

#### GitKraken (추천)
```
✅ 시각적 인터페이스
✅ 드래그 앤 드롭 Git 작업
✅ Merge Conflict 쉽게 해결
✅ 무료 (공개 저장소)
```

**가이드**: [GITKRAKEN_GUIDE.md](GITKRAKEN_GUIDE.md)

#### VS Code Git
```
✅ 간단한 작업에 최적
✅ VSCode 통합
✅ 무료
```

---

### 2️⃣ 터미널

#### Windows Terminal (권장)
```
다운로드: Microsoft Store
특징: 탭, 테마, GPU 가속
```

#### Git Bash
```
다운로드: https://git-scm.com/
특징: Unix 명령어 지원
```

---

### 3️⃣ Node.js 버전 관리

#### nvm (Node Version Manager)
```
Windows: https://github.com/coreybutler/nvm-windows
Mac/Linux: https://github.com/nvm-sh/nvm

사용법:
nvm install 20      # Node.js 20 설치
nvm use 20          # Node.js 20 사용
nvm list            # 설치된 버전 확인
```

---

### 4️⃣ 데이터베이스 도구

#### DBeaver (무료)
```
다운로드: https://dbeaver.io/
지원: PostgreSQL, MySQL, SQLite 등
```

#### TablePlus (유료)
```
다운로드: https://tableplus.com/
특징: 빠르고 깔끔한 UI
```

---

### 5️⃣ API 테스트

#### REST Client (VSCode 확장) ✅
```
파일에 HTTP 요청 작성:
GET https://api.github.com/users/octocat
Content-Type: application/json

F5 키로 실행
```

#### Thunder Client (VSCode 확장)
```
Postman 대체
GUI 인터페이스
```

#### Postman (독립 앱)
```
다운로드: https://www.postman.com/
특징: 강력한 기능
```

---

## 최적 세팅 가이드

### 🎯 초보자 세팅

#### 필수 확장 프로그램
```
✅ ESLint
✅ Prettier
✅ Error Lens
✅ GitLens
✅ Continue (AI)
✅ Material Icon Theme
```

#### 권장 도구
```
✅ GitKraken - Git GUI
✅ Windows Terminal - 터미널
```

#### 학습 자료
```
📚 VSCode 가이드: .vscode/SETUP_GUIDE.md
📚 GitKraken 가이드: docs/GITKRAKEN_GUIDE.md
📚 MCP 가이드: docs/MCP_SETUP_GUIDE.md
```

---

### 🚀 중급 개발자 세팅

#### 추가 확장 프로그램
```
✅ Tabnine - AI 자동완성
✅ TODO Tree - TODO 관리
✅ Bookmarks - 코드 북마크
✅ REST Client - API 테스트
```

#### 추가 도구
```
✅ nvm - Node 버전 관리
✅ DBeaver - 데이터베이스 도구
```

#### 설정
```
✅ MCP 서버 활성화
✅ Continue 커스텀 명령어 설정
✅ 코드 스니펫 활용
```

---

### ⚡ 고급 개발자 세팅

#### 프로 확장 프로그램
```
✅ GitHub Copilot - AI 코드 생성
✅ Puppeteer MCP - 웹 스크래핑
✅ PostgreSQL MCP - DB 통합
✅ Command Runner - 워크플로우 자동화
```

#### 고급 도구
```
✅ Docker Desktop
✅ TablePlus
✅ Postman
```

#### 워크플로우
```
✅ CI/CD (GitHub Actions)
✅ Pre-commit hooks (Husky)
✅ 커스텀 MCP 서버
```

---

## 워크플로우 추천

### 📝 일반적인 개발 워크플로우

#### 1. 프로젝트 시작
```bash
# 1. 저장소 클론
git clone <repository-url>
cd <project-name>

# 2. 의존성 설치
npm install

# 3. VSCode 열기
code .

# 4. 개발 서버 실행
npm run dev
# 또는 F5 키 (디버그 모드)
```

#### 2. 기능 개발
```
1. GitKraken에서 새 브랜치 생성
   feature/your-feature-name

2. VSCode에서 코드 작성
   - Continue AI로 도움 받기 (Ctrl+L)
   - Tabnine 자동완성 활용
   - Error Lens로 에러 즉시 확인

3. 테스트 작성
   - Ctrl+Shift+P → "Run Test"
   - 또는 /test 명령어로 AI가 생성

4. 커밋
   - GitKraken에서 시각적으로 확인
   - 또는 Continue의 /commit 명령어
```

#### 3. 코드 리뷰
```
1. GitKraken에서 Push

2. Pull Request 생성
   - GitKraken 또는 GitHub 웹

3. Continue AI에게 코드 리뷰 요청
   /review "이 코드를 리뷰해주세요"
```

#### 4. 디버깅
```
1. 중단점 설정 (줄 번호 클릭)

2. F5 키로 디버깅 시작

3. Continue AI에게 질문
   "이 에러가 왜 발생하나요?"
```

---

### 💡 생산성 팁

#### VSCode 단축키
```
Ctrl+L          - Continue 채팅
Ctrl+P          - 파일 빠르게 열기
Ctrl+Shift+P    - 명령 팔레트
F5              - 디버깅 시작
Ctrl+Shift+B    - 빌드
Alt+Shift+F     - 코드 포맷팅
Ctrl+/          - 주석 토글
```

#### Continue AI 활용
```
선택한 코드 설명:
1. 코드 선택
2. Ctrl+L
3. "이 코드가 뭐하는 거야?"

버그 수정:
1. 에러 코드 선택
2. Ctrl+L
3. /fix

테스트 생성:
1. 함수 선택
2. Ctrl+L
3. /test
```

#### GitKraken 활용
```
브랜치 전환: 브랜치 더블클릭
브랜치 생성: 브랜치 우클릭
커밋: 하단 패널에서 작성
Merge: 브랜치 드래그 앤 드롭!
```

---

## 📊 완전한 개발 환경 체크리스트

### 필수 도구
- [x] ✅ VSCode 설치
- [x] ✅ Node.js 20+ 설치
- [x] ✅ Git 설치
- [x] ✅ npm 10+ 설치

### VSCode 확장
- [x] ✅ ESLint, Prettier (코드 품질)
- [x] ✅ GitLens, Git Graph (Git)
- [x] ✅ Error Lens (에러 표시)
- [x] ✅ Continue (AI 도우미)
- [x] ✅ Tabnine (AI 자동완성)
- [x] ✅ Material Icons (테마)

### 설정 파일
- [x] ✅ .vscode/ (VSCode 설정)
- [x] ✅ .mcp/ (MCP 서버)
- [x] ✅ .continue/ (Continue AI)
- [x] ✅ .env (환경 변수)

### API 키
- [ ] ⚠️ ANTHROPIC_API_KEY (필수!)
- [ ] ⚪ GITHUB_TOKEN (선택)
- [ ] ⚪ 기타 API 키들

### 추가 도구 (선택)
- [ ] GitKraken 설치
- [ ] Windows Terminal 설치
- [ ] nvm 설치
- [ ] DBeaver 설치 (DB 사용시)

### 학습
- [ ] VSCode 기본 사용법
- [ ] Continue AI 사용법
- [ ] Git 기초
- [ ] GitKraken 사용법

---

## 🎉 축하합니다!

**완벽한 개발 환경이 준비되었습니다!**

### 다음 단계:

1. **VSCode 재시작**
   ```
   Ctrl+Shift+P → "Reload Window"
   ```

2. **.env에 API 키 입력**
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```

3. **Continue AI 테스트**
   ```
   Ctrl+L → "안녕? 테스트야"
   ```

4. **개발 시작!**
   ```bash
   npm run dev
   # 또는 F5
   ```

---

## 📚 추가 문서

- [VSCode 초보자 가이드](.vscode/SETUP_GUIDE.md)
- [GitKraken 사용법](GITKRAKEN_GUIDE.md)
- [MCP 설정 가이드](MCP_SETUP_GUIDE.md)
- [프로젝트 README](../README.md)

---

**행복한 코딩 되세요!** 💻✨

질문이 있으면 언제든 Continue AI (Ctrl+L)에게 물어보세요!
