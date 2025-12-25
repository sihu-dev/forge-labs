# MCP 서버 상태 동기화
# 사용법: /mcp-sync

## 실행 시 수행 작업

### 1. MCP 서버 상태 확인
```bash
# 활성 MCP 서버 목록 확인
claude mcp list
```

### 2. 서버별 상태 출력
```markdown
## MCP 서버 상태

| 서버 | 상태 | 도구 수 | 설명 |
|------|------|---------|------|
| github | ✅ 연결됨 | 12 | PR, Issues, Repo 관리 |
| supabase | ✅ 연결됨 | 8 | DB 쿼리, 마이그레이션 |
| playwright | ✅ 연결됨 | 6 | E2E 테스트, 스크린샷 |
| filesystem | ✅ 연결됨 | 5 | 파일 읽기/쓰기 |
| memory | ✅ 연결됨 | 3 | 컨텍스트 저장/로드 |
```

### 3. 사용 가능한 MCP 도구

#### GitHub MCP
- `github_create_pr` - PR 생성
- `github_list_issues` - 이슈 목록
- `github_merge_pr` - PR 머지
- `github_create_branch` - 브랜치 생성

#### Supabase MCP
- `supabase_query` - SQL 쿼리 실행
- `supabase_insert` - 데이터 삽입
- `supabase_update` - 데이터 업데이트
- `supabase_migrate` - 마이그레이션 실행

#### Playwright MCP
- `playwright_navigate` - 페이지 이동
- `playwright_screenshot` - 스크린샷 캡처
- `playwright_click` - 요소 클릭
- `playwright_fill` - 입력 필드 채우기

### 4. Chrome Claude 연동 확인

Chrome Claude 확장에서 사용하려면:
1. chrome://extensions 에서 Claude 확장 활성화
2. MCP 서버 URL 설정: `http://localhost:3333/mcp`
3. 인증 토큰 입력

### 5. 트러블슈팅

```bash
# MCP 서버 재시작
claude mcp restart

# 특정 서버만 재시작
claude mcp restart github

# 로그 확인
claude mcp logs --tail 50
```

## 모바일 단축 명령

```
ㅁ → /mcp-sync (MCP 상태 확인)
```
