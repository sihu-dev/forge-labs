# 🐙 GitKraken 설정 및 사용 가이드

> Git을 시각적으로 쉽게 사용하는 방법 - 초보자를 위한 완벽 가이드

---

## 📋 목차

1. [GitKraken이란?](#gitkraken이란)
2. [설치 방법](#설치-방법)
3. [프로젝트 열기](#프로젝트-열기)
4. [기본 사용법](#기본-사용법)
5. [실전 워크플로우](#실전-워크플로우)
6. [GitKraken vs 다른 도구](#gitkraken-vs-다른-도구)
7. [팁과 요령](#팁과-요령)

---

## GitKraken이란?

### 🎯 특징
- **시각적 Git 클라이언트**: 명령어 없이 Git 사용
- **직관적 UI**: 드래그 앤 드롭으로 Git 작업
- **크로스 플랫폼**: Windows, Mac, Linux 모두 지원
- **무료 버전 제공**: 공개 저장소는 무료 사용

### 💡 왜 GitKraken을 사용하나요?
- ✅ 명령어를 몰라도 Git 사용 가능
- ✅ 브랜치, 커밋 히스토리가 한눈에 보임
- ✅ Merge Conflict 해결이 쉬움
- ✅ 여러 프로젝트 동시 관리
- ✅ GitHub, GitLab 등과 연동

---

## 설치 방법

### 1️⃣ GitKraken 다운로드

**공식 사이트**: https://www.gitkraken.com/

1. 위 사이트 접속
2. "Download for Free" 클릭
3. Windows용 설치 파일 다운로드

### 2️⃣ 설치

1. 다운로드한 설치 파일 실행
2. 설치 위치 선택 (기본값 권장)
3. 설치 완료 후 실행

### 3️⃣ 초기 설정

#### GitHub 계정 연동 (권장)
1. GitKraken 실행
2. "Sign up with GitHub" 또는 "Sign in"
3. GitHub 계정으로 로그인
4. GitKraken 접근 권한 허용

#### Git 설정 확인
```
File → Preferences → General
```
- **Name**: 커밋 작성자 이름
- **Email**: GitHub 이메일
- **Editor**: VSCode 선택 권장

---

## 프로젝트 열기

### 방법 1: 기존 프로젝트 열기

1. **File → Open Repo**
2. **Open a Repository** 선택
3. 프로젝트 폴더 선택:
   ```
   c:\Users\sihu2\OneDrive\Desktop\hyein-agent
   ```
4. "Open" 클릭

### 방법 2: Clone (복제)

1. **File → Clone Repo**
2. **GitHub.com** 선택
3. 저장소 검색: `saucefirstteam/hyein-agent`
4. 저장 위치 선택
5. "Clone the repo!" 클릭

### 방법 3: URL로 Clone

1. **File → Clone Repo**
2. **URL** 탭 선택
3. 저장소 URL 입력:
   ```
   https://github.com/saucefirstteam/hyein-agent.git
   ```
4. 저장 위치 선택
5. "Clone the repo!" 클릭

---

## 기본 사용법

### 🖼️ GitKraken 화면 구성

```
┌─────────────────────────────────────────────────────┐
│  상단 툴바 (브랜치, Pull, Push 등)                     │
├───────────────┬─────────────────────────────────────┤
│               │                                     │
│  왼쪽 사이드바  │         중앙: Commit Graph           │
│               │      (브랜치 히스토리 시각화)          │
│  - LOCAL      │                                     │
│  - REMOTE     │                                     │
│  - BRANCHES   │                                     │
│  - TAGS       │                                     │
│  - STASHES    │                                     │
│               ├─────────────────────────────────────┤
│               │    하단: Commit Panel               │
│               │  (변경사항, Staging, Commit 메시지)   │
└───────────────┴─────────────────────────────────────┘
```

### 📝 기본 Git 작업

#### 1. 변경사항 확인 (Status)

**자동으로 표시됨!**
- 하단 패널에 변경된 파일 목록이 자동으로 나타납니다
- 파일 클릭하면 변경 내용(diff)을 볼 수 있음

#### 2. Staging (커밋 준비)

**방법 1: 개별 파일**
- 하단 패널의 "Unstaged Files"에서 파일 찾기
- 파일에 마우스 오버 → "Stage File" 버튼 클릭
- 또는 파일을 "Staged Files"로 드래그

**방법 2: 모든 파일**
- "Stage all changes" 버튼 클릭 (Unstaged Files 옆)

#### 3. Commit (커밋)

1. 하단 패널의 "Commit Message" 입력란 클릭
2. 커밋 메시지 작성:
   ```
   feat: VSCode 설정 추가

   - settings.json, launch.json 등 추가
   - 확장 프로그램 27개 자동 설치 스크립트
   - 초보자 가이드 문서 작성
   ```
3. "Commit changes to X files" 버튼 클릭

#### 4. Push (원격 저장소에 업로드)

**방법 1: 툴바 버튼**
- 상단 툴바의 **Push** 버튼 클릭

**방법 2: 커밋에서 직접**
- 커밋 우클릭 → "Push" 선택

#### 5. Pull (원격 저장소에서 가져오기)

**방법 1: 툴바 버튼**
- 상단 툴바의 **Pull** 버튼 클릭

**방법 2: 자동 Fetch**
- GitKraken은 자동으로 원격 변경사항을 확인합니다
- 새로운 커밋이 있으면 알림이 표시됨

---

## 실전 워크플로우

### 📌 시나리오 1: 새로운 기능 추가

#### Step 1: 새 브랜치 생성
1. 왼쪽 사이드바에서 **BRANCHES** 찾기
2. `main` 브랜치 우클릭
3. "Create branch here" 선택
4. 브랜치 이름 입력:
   ```
   feature/add-vscode-settings
   ```
5. Enter 또는 "Create Branch" 클릭

#### Step 2: 코드 작업
1. VSCode에서 코드 작성
2. GitKraken에서 변경사항 자동 감지됨

#### Step 3: 커밋
1. 하단 패널에서 변경 파일 확인
2. "Stage all changes" 클릭
3. 커밋 메시지 작성
4. "Commit" 클릭

#### Step 4: Push
1. 상단 "Push" 버튼 클릭
2. 원격에 브랜치가 생성됨

#### Step 5: Pull Request 생성
1. 상단 툴바의 **+ (Create a pull request)** 클릭
2. 또는 브랜치 우클릭 → "Start a pull request"
3. GitHub 웹사이트에서 PR 작성

---

### 📌 시나리오 2: 메인 브랜치 업데이트

#### Step 1: 브랜치 전환
1. 왼쪽 사이드바에서 `main` 브랜치 찾기
2. 더블클릭하여 체크아웃

#### Step 2: Pull
1. 상단 "Pull" 버튼 클릭
2. 최신 변경사항 가져오기

---

### 📌 시나리오 3: Merge Conflict 해결

#### Conflict 발생 시
1. GitKraken이 자동으로 Conflict 감지
2. 충돌 파일이 노란색으로 표시됨

#### 해결 방법
1. 충돌 파일 클릭
2. **Merge Tool** 열기
3. 세 가지 패널 표시:
   - 왼쪽: 현재 브랜치 버전
   - 오른쪽: 대상 브랜치 버전
   - 하단: 결과 (최종 버전)
4. 원하는 버전 선택 또는 수동 수정
5. "Save" 클릭
6. 모든 충돌 해결 후 "Commit" 클릭

---

### 📌 시나리오 4: 특정 커밋으로 돌아가기

#### Soft Reset (변경사항 유지)
1. 돌아갈 커밋 찾기
2. 커밋 우클릭
3. "Reset main to this commit"
4. **Soft** 선택 (변경사항은 Unstaged로 유지)

#### Hard Reset (변경사항 삭제 - 위험!)
1. 커밋 우클릭
2. "Reset main to this commit"
3. **Hard** 선택
4. ⚠️ 주의: 모든 변경사항이 삭제됨!

---

### 📌 시나리오 5: 임시 저장 (Stash)

작업 중인 변경사항을 임시로 저장하고 나중에 복원:

#### Stash 생성
1. 하단 패널의 "Stash" 버튼 클릭
2. Stash 메시지 입력 (선택)
3. "Create Stash" 클릭

#### Stash 복원
1. 왼쪽 사이드바의 **STASHES** 찾기
2. 복원할 Stash 우클릭
3. "Pop Stash" 또는 "Apply Stash" 선택
   - **Pop**: 복원 후 Stash 삭제
   - **Apply**: Stash 유지

---

## GitKraken vs 다른 도구

### 🆚 비교표

| 기능 | GitKraken | VS Code Git | GitHub Desktop | Git 명령어 |
|------|-----------|-------------|----------------|-----------|
| 시각적 히스토리 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ❌ |
| 사용 난이도 | 쉬움 | 중간 | 쉬움 | 어려움 |
| 브랜치 관리 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Merge Conflict | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| 무료 | 제한적 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 고급 기능 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

### 💡 언제 무엇을 사용할까?

**GitKraken 사용 시기:**
- Git 초보자일 때
- 복잡한 브랜치 관리가 필요할 때
- 히스토리를 시각적으로 보고 싶을 때
- Merge Conflict가 자주 발생할 때

**VS Code Git 사용 시기:**
- 간단한 커밋/푸시만 할 때
- VSCode에서 바로 작업할 때
- 빠른 작업이 필요할 때

**Git 명령어 사용 시기:**
- 고급 Git 기능이 필요할 때
- 스크립트 자동화
- 서버 환경

---

## 팁과 요령

### 🎯 생산성 팁

#### 1. 키보드 단축키
```
Ctrl+P     - Quick Open (프로젝트 전환)
Ctrl+T     - Open Terminal
Ctrl+Enter - Commit
Ctrl+Shift+P - Push
Ctrl+Shift+L - Pull
```

#### 2. 여러 프로젝트 동시 관리
- **Tabs**로 여러 저장소 동시에 열기
- 상단 탭 클릭으로 빠른 전환

#### 3. WIP (Work In Progress) 커밋
- 작업 중인 내용을 임시 커밋:
  ```
  WIP: 기능 구현 중
  ```
- 나중에 `git rebase` 또는 GitKraken의 "Squash" 기능으로 정리

#### 4. Interactive Rebase
- 여러 커밋을 하나로 합치기 (Squash)
- 커밋 순서 변경
- 커밋 메시지 수정

**방법:**
1. 커밋 우클릭
2. "Interactive Rebase" 선택
3. 원하는 작업 수행

#### 5. Cherry Pick
- 특정 커밋만 다른 브랜치로 가져오기

**방법:**
1. 가져올 커밋 찾기
2. 커밋 우클릭
3. "Cherry Pick Commit" 선택
4. 대상 브랜치 선택

---

### 🎨 커스터마이징

#### 테마 변경
```
File → Preferences → UI Customization
```
- Light Theme / Dark Theme 선택
- 색상 구성표 변경

#### Commit Graph 설정
```
File → Preferences → Commit Graph
```
- 표시할 정보 설정
- 그래프 스타일 변경

---

### ⚠️ 주의사항

#### 1. Force Push 금지
- **절대** `main` 브랜치에 Force Push 하지 마세요!
- 팀원의 작업이 날아갈 수 있습니다

#### 2. Rebase 주의
- 이미 Push한 커밋은 Rebase하지 마세요
- Rebase는 로컬에서만 사용

#### 3. 민감 정보 커밋 금지
- `.env` 파일 커밋 금지
- API 키, 비밀번호 절대 커밋하지 마세요
- 실수로 커밋했다면 즉시 키 재발급

---

## 🆘 문제 해결

### Q: GitKraken이 저장소를 인식 못 해요
**A**: Git이 설치되어 있는지 확인
```bash
git --version
```
없으면 https://git-scm.com/ 에서 설치

### Q: Push가 안 돼요
**A**: GitHub 인증 확인
1. File → Preferences → Integrations
2. GitHub 연결 상태 확인
3. 필요시 재인증

### Q: Merge Conflict가 너무 복잡해요
**A**:
1. GitKraken의 Merge Tool 사용
2. 또는 VSCode에서 파일 직접 수정
3. 해결 후 GitKraken에서 "Mark as resolved"

### Q: 실수로 커밋을 지웠어요
**A**: Reflog 확인
1. 상단 툴바 → View → Reflog
2. 삭제된 커밋 찾기
3. 커밋 우클릭 → Cherry Pick

---

## 📚 추가 학습 자료

### GitKraken 공식 자료
- **공식 문서**: https://help.gitkraken.com/
- **튜토리얼 비디오**: https://www.gitkraken.com/learn/git
- **Git 기초**: https://www.gitkraken.com/learn/git/tutorials

### Git 학습
- **Git 입문**: https://git-scm.com/book/ko/v2
- **GitHub 가이드**: https://docs.github.com/ko
- **Git 시각화**: https://learngitbranching.js.org/?locale=ko

---

## 🎓 실습 예제

### 연습 1: 첫 커밋 만들기
1. README.md 파일 수정
2. GitKraken에서 변경사항 확인
3. Stage → Commit → Push

### 연습 2: 브랜치 생성 및 병합
1. `feature/test` 브랜치 생성
2. 파일 수정 후 커밋
3. `main`으로 전환
4. `feature/test` 브랜치 병합

### 연습 3: Pull Request 생성
1. 새 브랜치에서 작업
2. Push
3. GitKraken에서 PR 생성
4. GitHub에서 리뷰

---

## ✅ 체크리스트

- [ ] GitKraken 설치 완료
- [ ] GitHub 계정 연동
- [ ] 프로젝트 열기 성공
- [ ] 첫 커밋 만들기 완료
- [ ] Push/Pull 이해함
- [ ] 브랜치 생성/전환 가능
- [ ] Merge Conflict 해결 방법 이해

---

**축하합니다! 이제 GitKraken으로 Git을 마스터할 준비가 되었습니다!** 🎉

더 궁금한 점이 있으면 언제든 물어보세요!
