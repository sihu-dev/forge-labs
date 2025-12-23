# 🔌 MCP (Model Context Protocol) 완벽 설정 가이드

> AI 에이전트와 도구를 연결하는 최신 표준 프로토콜

---

## 📋 목차

1. [MCP란 무엇인가?](#mcp란-무엇인가)
2. [설치 및 설정](#설치-및-설정)
3. [사용 가능한 MCP 서버](#사용-가능한-mcp-서버)
4. [Claude Desktop 연동](#claude-desktop-연동)
5. [VSCode 연동](#vscode-연동)
6. [커스텀 MCP 서버 만들기](#커스텀-mcp-서버-만들기)
7. [문제 해결](#문제-해결)

---

## MCP란 무엇인가?

### 🎯 개념
**Model Context Protocol (MCP)**는 AI 모델이 외부 데이터 소스와 도구에 접근할 수 있게 해주는 표준 프로토콜입니다.

### 💡 왜 MCP를 사용하나요?

**기존 방식의 문제:**
```
AI ─── API 호출 ──→ 도구 1
    └── API 호출 ──→ 도구 2
    └── API 호출 ──→ 도구 3
```
- 각 도구마다 다른 API
- 통합이 어려움
- 유지보수 힘듦

**MCP 방식:**
```
AI ─── MCP ──→ 표준 인터페이스 ──→ 모든 도구
```
- 하나의 표준 프로토콜
- 쉬운 통합
- 확장 가능

### 🌟 주요 기능

1. **파일 시스템 접근**: 프로젝트 파일 읽기/쓰기
2. **데이터베이스 연동**: PostgreSQL, SQLite 등
3. **Git/GitHub**: 저장소 관리
4. **웹 스크래핑**: Puppeteer로 웹 데이터 수집
5. **메모리**: 대화 컨텍스트 유지

---

## 설치 및 설정

### 1️⃣ 사전 요구사항

```bash
# Node.js 20+ 필요
node --version  # v20.0.0 이상

# npm 10+ 필요
npm --version   # v10.0.0 이상
```

### 2️⃣ MCP 설정 파일

프로젝트에 이미 설정 파일이 생성되어 있습니다:
📁 [.mcp/config.json](../.mcp/config.json)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"],
      "description": "파일 시스템 접근",
      "disabled": false
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "GitHub 연동",
      "disabled": false
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "description": "컨텍스트 메모리",
      "disabled": false
    }
  }
}
```

### 3️⃣ 환경 변수 설정

[.env](.env) 파일에 추가:

```env
# MCP 서버 설정
GITHUB_TOKEN=ghp_여기에_GitHub_Personal_Access_Token
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

---

## 사용 가능한 MCP 서버

### 🔥 필수 서버 (기본 활성화)

#### 1. **Filesystem Server**
파일 시스템 접근

**기능:**
- 파일 읽기/쓰기
- 디렉토리 탐색
- 파일 검색

**사용 예:**
```typescript
// AI가 파일을 읽고 분석할 수 있음
"README.md 파일을 읽고 요약해줘"
"src/ 폴더의 모든 TypeScript 파일을 찾아줘"
```

**설정:**
```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"],
    "disabled": false
  }
}
```

---

#### 2. **GitHub Server**
GitHub 저장소 관리

**기능:**
- Issue 생성/관리
- Pull Request 생성
- 코드 검색
- Commit 조회

**설정:**
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
    }
  }
}
```

**GitHub Token 발급:**
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. 권한 선택:
   - `repo` (전체 저장소 접근)
   - `workflow` (GitHub Actions)
   - `read:org` (조직 정보)

---

#### 3. **Memory Server**
대화 컨텍스트 유지

**기능:**
- 이전 대화 기억
- 프로젝트 정보 저장
- 사용자 선호도 학습

**사용 예:**
```typescript
"이전에 말한 API 키 기억해?"
"내가 선호하는 코딩 스타일로 작성해줘"
```

---

### 💡 선택적 서버 (비활성화됨)

#### 4. **Puppeteer Server**
웹 스크래핑

**기능:**
- 웹페이지 크롤링
- 스크린샷
- PDF 생성

**활성화:**
```json
{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
    "disabled": false  // true → false로 변경
  }
}
```

---

#### 5. **PostgreSQL Server**
PostgreSQL 데이터베이스 접근

**기능:**
- SQL 쿼리 실행
- 스키마 조회
- 데이터 분석

**설정:**
```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "POSTGRES_CONNECTION_STRING": "${DATABASE_URL}"
    },
    "disabled": false
  }
}
```

**.env 파일:**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

---

#### 6. **SQLite Server**
SQLite 데이터베이스 접근

**사용 예:**
```typescript
"데이터베이스의 users 테이블을 보여줘"
"최근 100개의 로그를 분석해줘"
```

---

## Claude Desktop 연동

### 1️⃣ Claude Desktop 설치

**다운로드**: https://claude.ai/download

### 2️⃣ 설정 파일 위치

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Mac:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 3️⃣ 설정 파일 작성

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "c:\\Users\\sihu2\\OneDrive\\Desktop\\hyein-agent"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### 4️⃣ Claude Desktop 재시작

설정 적용을 위해 Claude Desktop을 재시작하세요.

---

## VSCode 연동

### 1️⃣ Continue 확장 설치

**Continue**는 VSCode에서 MCP를 지원하는 AI 코딩 도우미입니다.

```
1. VSCode에서 Ctrl+Shift+X
2. "Continue" 검색
3. 설치 클릭
```

### 2️⃣ Continue 설정

**설정 파일 열기:**
```
Ctrl+Shift+P → "Continue: Open config.json"
```

**설정 예시:**
```json
{
  "models": [
    {
      "title": "Claude Sonnet 4.5",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "apiKey": "sk-ant-api03-your-key"
    }
  ],
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"]
    },
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token"
      }
    }
  ]
}
```

---

## 커스텀 MCP 서버 만들기

### 프로젝트 전용 MCP 서버

이 프로젝트에 맞는 커스텀 MCP 서버를 만들 수 있습니다.

**예: 정부지원사업 MCP 서버**

```typescript
// src/mcp/government-support-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "government-support-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 공고 검색 도구
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "search_announcements") {
    const keyword = request.params.arguments?.keyword;
    // 공고 검색 로직
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            announcements: [/* 검색 결과 */]
          })
        }
      ]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
```

---

## 문제 해결

### ❌ "MCP 서버를 찾을 수 없습니다"

**해결:**
1. Node.js 버전 확인:
   ```bash
   node --version  # v20+ 필요
   ```

2. npx 캐시 삭제:
   ```bash
   npm cache clean --force
   ```

3. 수동 설치:
   ```bash
   npm install -g @modelcontextprotocol/server-filesystem
   ```

---

### ❌ "GitHub 토큰 오류"

**해결:**
1. Token 권한 확인 (repo, workflow 필요)
2. Token 만료 확인
3. .env 파일에 올바르게 입력되었는지 확인

---

### ❌ "메모리 서버가 작동하지 않습니다"

**해결:**
1. 메모리 서버 재시작:
   ```bash
   npx -y @modelcontextprotocol/server-memory
   ```

2. 캐시 삭제:
   - Windows: `%TEMP%\mcp-memory` 폴더 삭제
   - Mac/Linux: `/tmp/mcp-memory` 폴더 삭제

---

## 📊 MCP 서버 비교

| 서버 | 용도 | 필수도 | 난이도 |
|------|------|--------|--------|
| Filesystem | 파일 접근 | ⭐⭐⭐⭐⭐ | 쉬움 |
| GitHub | Git 연동 | ⭐⭐⭐⭐ | 쉬움 |
| Memory | 컨텍스트 유지 | ⭐⭐⭐⭐ | 쉬움 |
| Puppeteer | 웹 스크래핑 | ⭐⭐ | 중간 |
| PostgreSQL | DB 접근 | ⭐⭐⭐ | 중간 |
| SQLite | DB 접근 | ⭐⭐⭐ | 쉬움 |

---

## 🎯 권장 설정

### 초보자 (최소 설정)
```json
{
  "mcpServers": {
    "filesystem": { "disabled": false },
    "memory": { "disabled": false }
  }
}
```

### 일반 개발자 (권장)
```json
{
  "mcpServers": {
    "filesystem": { "disabled": false },
    "github": { "disabled": false },
    "memory": { "disabled": false }
  }
}
```

### 고급 사용자 (전체)
```json
{
  "mcpServers": {
    "filesystem": { "disabled": false },
    "github": { "disabled": false },
    "memory": { "disabled": false },
    "puppeteer": { "disabled": false },
    "postgres": { "disabled": false }
  }
}
```

---

## 📚 추가 자료

### 공식 문서
- **MCP 공식 사이트**: https://modelcontextprotocol.io/
- **GitHub**: https://github.com/modelcontextprotocol
- **문서**: https://modelcontextprotocol.io/docs

### 커뮤니티
- **Discord**: https://discord.gg/mcp
- **Forum**: https://forum.modelcontextprotocol.io/

---

## ✅ 체크리스트

- [ ] Node.js 20+ 설치됨
- [ ] MCP 설정 파일 생성 (.mcp/config.json)
- [ ] GitHub Token 발급 및 설정
- [ ] Claude Desktop 설정 (선택)
- [ ] VSCode Continue 설정 (선택)
- [ ] MCP 서버 테스트 완료

---

**MCP로 AI 에이전트의 능력을 확장하세요!** 🚀

궁금한 점이 있으면 언제든 물어보세요!
