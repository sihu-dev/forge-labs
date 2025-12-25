# FORGE LABS - Chrome Claude 컨텍스트

> Chrome Claude 확장에서 이 파일을 읽어 프로젝트 컨텍스트를 제공합니다.

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **이름** | FORGE LABS |
| **유형** | AI 플랫폼 모노레포 |
| **구성** | HEPHAITOS (트레이딩) + BIDFLOW (입찰) |
| **기술** | Next.js 15 + Supabase + TypeScript |

## 활성 MCP 서버

| 서버 | 용도 | 주요 도구 |
|------|------|-----------|
| **github** | PR/이슈 관리 | create_pr, list_issues, merge_pr |
| **supabase** | DB 연동 | query, insert, migrate |
| **playwright** | E2E 테스트 | navigate, screenshot, click |
| **filesystem** | 파일 시스템 | read, write, list |
| **memory** | 컨텍스트 유지 | save, load, clear |

## 단축 명령어

```
ㅅ → 상태 확인
ㅎ → HEPHAITOS 개발
ㅂ → BIDFLOW 개발
ㄱ → 다음 태스크
ㅋ → 커밋 & 푸시
ㅁ → MCP 상태 확인
```

## 현재 작업 상태

### HEPHAITOS (80%)
- ✅ 타입 시스템, 유틸리티, 코어 서비스
- 🔄 No-Code 빌더
- ⏳ 백테스트 엔진, 실계좌 연동

### BIDFLOW (60%)
- ✅ 대시보드, CRM, Integrations
- 🔄 API 연결
- ⏳ n8n 워크플로우

## MCP 통합 워크플로우

### 1. GitHub 작업
```
Claude: "새 PR 만들어줘"
→ github MCP → create_pr 호출
→ PR URL 반환
```

### 2. DB 작업
```
Claude: "users 테이블 조회해줘"
→ supabase MCP → query 호출
→ 결과 반환
```

### 3. E2E 테스트
```
Claude: "로그인 페이지 스크린샷"
→ playwright MCP → navigate + screenshot
→ 이미지 반환
```

## 파일 구조

```
forge-labs/
├── apps/
│   ├── hephaitos/     # 트레이딩 플랫폼
│   └── bidflow/       # 입찰 자동화
├── packages/
│   ├── types/         # L0 타입
│   ├── utils/         # L1 유틸
│   ├── core/          # L2 로직
│   └── ui/            # L2 컴포넌트
├── .vscode/
│   ├── mcp.json       # MCP 설정
│   └── settings.json  # VS Code 설정
└── .claude/
    └── commands/      # Claude 스킬
```

## 연락처

- GitHub: https://github.com/sihu-dev/forge-labs
- 이슈: GitHub Issues 활용

---
*Last Updated: 2024-12-25*
