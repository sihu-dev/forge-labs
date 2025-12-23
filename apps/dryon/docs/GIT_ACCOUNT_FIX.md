# 🔧 Git 계정 충돌 해결 가이드

> GitHub 계정 충돌 및 인증 문제를 단계별로 해결하는 완벽 가이드

---

## 📋 현재 상황

### 확인된 문제
```
❌ Git 전역 설정 파일 없음 (.gitconfig)
❌ user.name 미설정
❌ user.email 미설정
✅ 원격 저장소: https://github.com/saucefirstteam/hyein-agent.git
```

### 발생 가능한 문제들
1. **커밋 실패**: "Please tell me who you are" 에러
2. **Push 실패**: 인증 실패
3. **계정 충돌**: 여러 GitHub 계정 사용 시

---

## 🚀 빠른 해결 방법

### 1️⃣ Git 사용자 설정 (필수!)

```bash
# 전역 설정 (모든 Git 프로젝트에 적용)
git config --global user.name "당신의_이름"
git config --global user.email "당신의_이메일@example.com"

# 예시
git config --global user.name "Hong Gildong"
git config --global user.email "gildong@gmail.com"
```

**⚠️ 중요**: 이메일은 **GitHub에 등록된 이메일**을 사용해야 합니다!

### 2️⃣ 프로젝트별 설정 (선택)

이 프로젝트만 다른 계정 사용:

```bash
# 프로젝트 디렉토리에서 실행
cd c:/Users/sihu2/OneDrive/Desktop/hyein-agent

git config user.name "프로젝트용_이름"
git config user.email "프로젝트용_이메일@example.com"
```

### 3️⃣ 설정 확인

```bash
# 전역 설정 확인
git config --global user.name
git config --global user.email

# 현재 프로젝트 설정 확인
git config user.name
git config user.email

# 모든 설정 보기
git config --list
```

---

## 🔐 GitHub 인증 설정

### Windows Credential Manager 사용 (권장)

#### 1. Git Credential Manager 설치 확인

```bash
git credential-manager --version
```

없으면 Git for Windows 재설치: https://git-scm.com/

#### 2. Credential Helper 설정

```bash
git config --global credential.helper manager-core
```

#### 3. 첫 Push 시 자동 로그인

다음 명령어 실행 시 브라우저에서 GitHub 로그인:

```bash
git push
```

### Personal Access Token 사용

#### 1. Token 생성

1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. 권한 선택:
   - `repo` (전체)
   - `workflow`
5. 생성된 토큰 복사

#### 2. Token으로 Push

```bash
# URL에 토큰 포함
git remote set-url origin https://YOUR_TOKEN@github.com/saucefirstteam/hyein-agent.git

# 또는 Push 시 입력
git push
Username: YOUR_GITHUB_USERNAME
Password: YOUR_TOKEN (비밀번호 대신!)
```

---

## 🔄 계정 전환 (여러 계정 사용 시)

### 방법 1: Git Credential Manager 삭제

```bash
# Windows Credential Manager에서 GitHub 자격 증명 삭제
1. Windows 검색 → "자격 증명 관리자"
2. Windows 자격 증명
3. "git:https://github.com" 찾기
4. 제거
5. 다음 git push 시 새로 로그인
```

### 방법 2: SSH 키 사용 (고급)

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "your_email@example.com"

# 공개 키 복사
cat ~/.ssh/id_ed25519.pub

# GitHub에 SSH 키 등록
GitHub → Settings → SSH and GPG keys → New SSH key

# 원격 저장소를 SSH로 변경
git remote set-url origin git@github.com:saucefirstteam/hyein-agent.git
```

---

## 📝 실전 시나리오

### 시나리오 1: "Please tell me who you are" 에러

**에러 메시지:**
```
*** Please tell me who you are.

Run
  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"
```

**해결:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
```

---

### 시나리오 2: Push 시 인증 실패

**에러:**
```
remote: Support for password authentication was removed
fatal: Authentication failed
```

**원인**: GitHub는 더 이상 비밀번호 인증을 지원하지 않음

**해결:**
1. Personal Access Token 사용
2. 또는 SSH 키 사용

---

### 시나리오 3: 다른 계정으로 커밋됨

**문제**: 회사 계정으로 커밋하고 싶은데 개인 계정으로 커밋됨

**해결:**
```bash
# 프로젝트별 설정 (이 프로젝트만)
git config user.name "Company Account"
git config user.email "work@company.com"

# 마지막 커밋 수정 (아직 Push 안 했을 때)
git commit --amend --reset-author
```

---

### 시나리오 4: 여러 GitHub 계정 관리

**방법 1: 프로젝트별 설정**
```bash
# 프로젝트 A
cd /path/to/project-a
git config user.name "Personal Account"
git config user.email "personal@gmail.com"

# 프로젝트 B
cd /path/to/project-b
git config user.name "Work Account"
git config user.email "work@company.com"
```

**방법 2: SSH 설정으로 자동화**

`~/.ssh/config` 파일 생성:
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

사용:
```bash
# 개인 프로젝트
git remote set-url origin git@github.com-personal:username/repo.git

# 회사 프로젝트
git remote set-url origin git@github.com-work:company/repo.git
```

---

## 🛠️ 자주 사용하는 Git 명령어

### 설정 관리
```bash
# 전역 설정
git config --global user.name "Your Name"
git config --global user.email "email@example.com"

# 프로젝트 설정
git config user.name "Project Name"
git config user.email "project@example.com"

# 설정 확인
git config --list
git config --list --show-origin  # 설정 파일 위치 포함

# 설정 삭제
git config --global --unset user.name
git config --unset user.name
```

### 저장소 관리
```bash
# 원격 저장소 확인
git remote -v

# 원격 저장소 URL 변경
git remote set-url origin <new-url>

# 원격 저장소 추가
git remote add upstream <url>
```

### 커밋 수정
```bash
# 마지막 커밋 메시지 수정
git commit --amend

# 마지막 커밋 작성자 변경
git commit --amend --author="Name <email@example.com>"

# 마지막 커밋 작성자를 현재 설정으로 변경
git commit --amend --reset-author
```

---

## 🔍 문제 진단

### Git 설정 확인
```bash
# 사용자 정보
git config user.name
git config user.email

# 인증 방법
git config credential.helper

# 원격 저장소
git remote -v

# 전체 설정
git config --list --show-origin
```

### Windows Credential Manager 확인
```
1. Windows 검색 → "자격 증명 관리자"
2. Windows 자격 증명
3. "git:https://github.com" 확인
```

### SSH 설정 확인
```bash
# SSH 키 확인
ls -al ~/.ssh

# SSH 연결 테스트
ssh -T git@github.com
```

---

## ✅ 완벽한 Git 설정 체크리스트

### 필수 설정
- [ ] `git config --global user.name` 설정
- [ ] `git config --global user.email` 설정 (GitHub 이메일과 동일)
- [ ] `git config --global credential.helper manager-core` 설정

### 인증 방법 (하나 선택)
- [ ] Windows Credential Manager (권장)
- [ ] Personal Access Token
- [ ] SSH 키

### 확인
- [ ] `git config --list` 정상 출력
- [ ] `git push` 성공
- [ ] GitHub에서 커밋 작성자 확인

---

## 🆘 추가 도움말

### Git 재설치
문제가 계속되면 Git을 재설치하세요:

1. **Git for Windows 다운로드**
   - https://git-scm.com/download/win

2. **설치 시 옵션**
   - Git Credential Manager 포함
   - OpenSSH 사용

3. **재설치 후**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your@email.com"
   git config --global credential.helper manager-core
   ```

### GitHub Desktop 사용
GUI가 더 편하다면:

1. **GitHub Desktop 다운로드**
   - https://desktop.github.com/

2. **장점**
   - 자동 인증
   - 시각적 인터페이스
   - 초보자 친화적

---

## 📞 이 프로젝트 빠른 설정

```bash
# 1. 사용자 설정 (당신의 정보로 변경!)
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"

# 2. 인증 설정
git config --global credential.helper manager-core

# 3. 확인
git config --list

# 4. 테스트 커밋
git add .
git commit -m "test: Git 설정 테스트"

# 5. Push (브라우저에서 GitHub 로그인)
git push
```

---

## 🎯 권장 설정

### 전역 설정 (한 번만)
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --global credential.helper manager-core
git config --global core.autocrlf true  # Windows 줄바꿈 자동 변환
git config --global init.defaultBranch main  # 기본 브랜치 main
```

### 에디터 설정
```bash
# VSCode를 기본 에디터로
git config --global core.editor "code --wait"
```

### 별칭 설정 (편의 기능)
```bash
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
git config --global alias.lg "log --oneline --graph --all"
```

---

**문제가 해결되었나요?**

더 도움이 필요하면:
- GitHub Docs: https://docs.github.com/
- Git Book: https://git-scm.com/book/ko/v2
- Stack Overflow: https://stackoverflow.com/questions/tagged/git

행운을 빕니다! 🍀
