# 🔄 잘못된 GitHub 계정 완전 초기화 가이드

> 모든 도구(VSCode, MCP, Git, Continue 등)에서 잘못된 GitHub 계정을 제거하고 올바른 계정으로 재설정하는 완벽 가이드

---

## 🎯 목표

**잘못된 GitHub 계정을 모든 곳에서 제거:**
- ✅ Windows Credential Manager
- ✅ Git 설정
- ✅ VSCode GitHub 연동
- ✅ GitHub Copilot
- ✅ Continue AI
- ✅ MCP GitHub Server
- ✅ GitKraken (사용 중이라면)

---

## 🚨 긴급 해결 단계

### 1️⃣ Windows Credential Manager 정리 (가장 중요!)

이것이 모든 도구가 참조하는 중앙 저장소입니다.

#### 방법 1: GUI로 삭제 (권장)

```
1. Windows 검색 → "자격 증명 관리자" 또는 "Credential Manager"
2. "Windows 자격 증명" 클릭
3. 다음 항목들을 찾아서 모두 제거:
   - git:https://github.com
   - vscode:github
   - LegacyGeneric:target=git:https://github.com
   - github.com 관련 모든 항목
4. 각 항목 펼치기 → "제거" 클릭
```

#### 방법 2: PowerShell로 삭제 (빠름)

```powershell
# PowerShell 관리자 권한으로 실행
cmdkey /list | Select-String "github" | ForEach-Object {
    $target = $_.Line -replace "^\s+Target: (.+)$", '$1'
    cmdkey /delete:$target
}
```

---

### 2️⃣ Git 설정 초기화

```bash
# 전역 설정 확인
git config --global --list

# 잘못된 사용자 정보 삭제
git config --global --unset user.name
git config --global --unset user.email

# 올바른 정보로 재설정
git config --global user.name "올바른_이름"
git config --global user.email "올바른_GitHub_이메일@example.com"

# 인증 방법 재설정
git config --global credential.helper manager-core
```

---

### 3️⃣ VSCode GitHub 로그아웃

#### A. GitHub 확장 로그아웃

```
1. Ctrl+Shift+P
2. "GitHub: Sign Out" 입력 → 실행
```

#### B. 계정 설정에서 로그아웃

```
1. 좌측 하단 "계정" 아이콘 클릭 (사람 모양)
2. GitHub 계정 찾기
3. "Sign Out" 클릭
```

#### C. VSCode 재시작

```
Ctrl+Shift+P → "Developer: Reload Window"
```

---

### 4️⃣ GitHub Copilot 재인증

```
1. Ctrl+Shift+P
2. "GitHub Copilot: Sign Out" 입력
3. VSCode 재시작
4. Ctrl+Shift+P → "GitHub Copilot: Sign In"
5. 브라우저에서 올바른 계정으로 로그인
```

---

### 5️⃣ Continue AI 재설정

#### 설정 파일 수정

[.continue/config.json](.continue/config.json) 파일 열기:

```json
{
  "models": [
    {
      "title": "Claude Sonnet 4.5",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  ]
}
```

`apiKey`가 환경 변수를 참조하는지 확인.

#### Continue 재시작

```
1. Ctrl+Shift+P
2. "Continue: Reload" 입력
```

---

### 6️⃣ MCP GitHub Server 재설정

#### A. .env 파일 수정

[.env](.env) 파일에서:

```env
# 기존 잘못된 토큰 제거
# GITHUB_TOKEN=ghp_wrong_token

# 새 토큰으로 교체 (아래 7단계에서 발급)
GITHUB_TOKEN=ghp_new_correct_token
```

#### B. MCP 설정 확인

[.mcp/config.json](.mcp/config.json):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      },
      "disabled": false
    }
  }
}
```

---

### 7️⃣ 새 GitHub Personal Access Token 발급

#### A. 기존 토큰 제거

```
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. 기존 잘못된 토큰 찾기
4. "Delete" 클릭
```

#### B. 새 토큰 생성

```
1. "Generate new token (classic)" 클릭
2. Note: "Hyein Agent Development"
3. Expiration: 90 days 또는 No expiration
4. 권한 선택:
   ✅ repo (전체)
   ✅ workflow
   ✅ admin:public_key
   ✅ admin:repo_hook
   ✅ gist
   ✅ notifications
   ✅ user (전체)
5. "Generate token" 클릭
6. 생성된 토큰 복사 (다시 볼 수 없음!)
```

#### C. .env 파일에 저장

```env
GITHUB_TOKEN=ghp_새로_복사한_토큰
```

---

### 8️⃣ GitKraken 재인증 (사용 중이라면)

```
1. GitKraken 열기
2. File → Preferences → Integrations
3. GitHub → "Disconnect" 클릭
4. "Connect to GitHub" 클릭
5. 브라우저에서 올바른 계정으로 로그인
```

---

## 🧹 완전 초기화 스크립트

### PowerShell (관리자 권한)

```powershell
# 1. Windows Credential Manager 정리
Write-Host "GitHub 자격 증명 삭제 중..." -ForegroundColor Yellow
cmdkey /list | Select-String "github" | ForEach-Object {
    $target = $_.Line -replace "^\s+Target: (.+)$", '$1'
    Write-Host "삭제: $target" -ForegroundColor Red
    cmdkey /delete:$target
}

# 2. Git 전역 설정 확인
Write-Host "`nGit 전역 설정:" -ForegroundColor Cyan
git config --global user.name
git config --global user.email

Write-Host "`n완료! VSCode를 재시작하세요." -ForegroundColor Green
```

### 스크립트 실행 방법

```
1. PowerShell 관리자 권한으로 실행
2. 위 스크립트 복사 → 붙여넣기 → Enter
```

---

## 🔍 확인 방법

### 1. Windows Credential Manager 확인

```
자격 증명 관리자 → Windows 자격 증명
→ github 관련 항목이 없어야 함
```

### 2. Git 설정 확인

```bash
git config --global user.name
git config --global user.email
# 올바른 정보가 출력되어야 함
```

### 3. VSCode GitHub 연결 확인

```
1. 좌측 하단 계정 아이콘
2. 올바른 GitHub 계정이 표시되어야 함
```

### 4. GitHub Copilot 확인

```bash
# Copilot 상태 확인
Ctrl+Shift+P → "GitHub Copilot: Check Status"
# 올바른 계정이 표시되어야 함
```

### 5. Git Push 테스트

```bash
# 빈 커밋 생성
git commit --allow-empty -m "test: GitHub 계정 테스트"

# Push
git push

# 브라우저에서 올바른 계정으로 로그인 프롬프트가 나와야 함
```

---

## 🎯 완벽한 재설정 체크리스트

### Windows 시스템
- [ ] Windows Credential Manager에서 모든 GitHub 자격 증명 삭제
- [ ] PowerShell 스크립트로 자동 정리 완료

### Git 설정
- [ ] `git config --global user.name` 올바르게 설정
- [ ] `git config --global user.email` 올바르게 설정
- [ ] `git config --global credential.helper` 설정

### VSCode
- [ ] GitHub 확장에서 로그아웃
- [ ] 계정 설정에서 로그아웃
- [ ] VSCode 재시작 완료
- [ ] 올바른 계정으로 재로그인

### GitHub Copilot
- [ ] Copilot 로그아웃
- [ ] 올바른 계정으로 재로그인
- [ ] 상태 확인 완료

### Continue AI
- [ ] .continue/config.json 확인
- [ ] Continue 재시작
- [ ] 정상 작동 확인

### MCP
- [ ] 새 GitHub Token 발급
- [ ] .env 파일에 토큰 저장
- [ ] .mcp/config.json 확인

### GitKraken (선택)
- [ ] GitKraken에서 GitHub 연결 해제
- [ ] 올바른 계정으로 재연결

### 최종 테스트
- [ ] `git push` 성공
- [ ] VSCode에서 GitHub 작업 성공
- [ ] Copilot 정상 작동
- [ ] Continue AI 정상 작동

---

## 🆘 여전히 문제가 있다면?

### A. VSCode 완전 재설정

```bash
# VSCode 사용자 데이터 백업
# C:\Users\사용자명\AppData\Roaming\Code

# VSCode 완전 삭제
1. VSCode 제거
2. 위 폴더 삭제
3. VSCode 재설치
```

### B. Git 완전 재설치

```
1. Git 제거
2. C:\Users\사용자명\.gitconfig 삭제
3. Git 재설치: https://git-scm.com/
4. 설정 다시 입력
```

### C. SSH 키 사용 (최종 수단)

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "올바른_이메일@example.com"

# 공개 키 복사
cat ~/.ssh/id_ed25519.pub

# GitHub에 SSH 키 추가
GitHub → Settings → SSH and GPG keys → New SSH key

# 원격 저장소를 SSH로 변경
git remote set-url origin git@github.com:saucefirstteam/hyein-agent.git

# 테스트
ssh -T git@github.com
```

---

## 💡 예방 팁

### 1. 프로젝트별 Git 설정 사용

```bash
# 전역 설정 대신 프로젝트별 설정
cd /path/to/project
git config user.name "프로젝트용_이름"
git config user.email "프로젝트용_이메일"
```

### 2. .env 파일 관리

```bash
# .env.example 사용
cp .env.example .env
# .env는 .gitignore에 추가되어 있음 (이미 완료)
```

### 3. 여러 GitHub 계정 관리

SSH 설정으로 계정별 자동 전환:

`~/.ssh/config`:
```
# 개인 계정
Host github.com-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_personal

# 회사 계정
Host github.com-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
```

---

## 📝 빠른 재설정 명령어 모음

```bash
# 1. Windows Credential Manager 정리
# (PowerShell 관리자 권한)
cmdkey /list | Select-String "github" | ForEach-Object { cmdkey /delete:($_.Line -replace "^\s+Target: (.+)$", '$1') }

# 2. Git 사용자 재설정
git config --global --unset user.name
git config --global --unset user.email
git config --global user.name "올바른_이름"
git config --global user.email "올바른_이메일@example.com"
git config --global credential.helper manager-core

# 3. VSCode 재시작
# Ctrl+Shift+P → "Reload Window"

# 4. 테스트
git config --global user.name
git config --global user.email
git push
```

---

## 🎉 성공 확인

모든 단계 완료 후:

```bash
# 1. Git 설정 확인
git config --global user.name
git config --global user.email

# 2. GitHub 연결 테스트
git push

# 3. VSCode 계정 확인
# 좌측 하단 계정 아이콘 → 올바른 계정 표시

# 4. Copilot 상태 확인
# Ctrl+Shift+P → "GitHub Copilot: Check Status"
```

**모두 정상이면 성공!** 🎊

---

**문제가 해결되었나요?**

더 도움이 필요하면:
- 📖 [GIT_ACCOUNT_FIX.md](GIT_ACCOUNT_FIX.md) - 기본 Git 설정 가이드
- 🌐 GitHub Docs: https://docs.github.com/
- 💬 Continue AI (Ctrl+L)에게 질문

**행복한 코딩 되세요!** 🚀
