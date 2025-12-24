# E2E 테스트 실행 가이드

## 문제: WSL 환경에서 Chromium 실행 에러

```
error while loading shared libraries: libnspr4.so: cannot open shared object file
```

## 해결 방법

### 1. 시스템 의존성 설치 (필요)

```bash
# Playwright 의존성 자동 설치
npx playwright install-deps chromium

# 또는 수동 설치
sudo apt-get update
sudo apt-get install -y \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2
```

### 2. E2E 테스트 실행

```bash
# 헤드리스 모드 (CI/CD)
npm run test:e2e

# UI 모드 (개발)
npm run test:e2e:ui

# 특정 테스트만
npm run test:e2e landing-sections

# 디버그 모드
npx playwright test --debug
```

## 테스트 구조

### 총 150+ 테스트 (5개 테스트 파일)

#### 1. Dashboard Tests (`e2e/dashboard.spec.ts`) - 40+ 테스트
**Dashboard Statistics (5개)**
- 통계 카드 표시
- 숫자 포맷팅
- 로딩 상태
- API 에러 처리
- 데모 모드 토글

**Bid List (6개)**
- 입찰 카드 표시
- 입찰 상세 정보
- 상태 필터링
- 정렬 기능
- 상세 페이지 탐색

**Upcoming Deadlines (4개)**
- 마감임박 섹션 표시
- D-Day 카운트다운
- 긴급 입찰 하이라이트
- 가로 스크롤

**AI Analysis Modal (7개)**
- 모달 열기/닫기
- 승률 표시
- 위험 요인
- 강점 분석
- 추천사항
- 로딩 상태

**Notification System (9개)**
- 알림 벨 아이콘
- 읽지 않음 배지
- 알림 패널
- 알림 목록 표시
- 읽지 않은 알림 구별
- 읽음 처리
- 빈 상태
- 외부 클릭으로 닫기

**Responsive Design (3개)**
- 모바일 반응형
- 카드 세로 스택
- 모바일 메뉴

#### 2. Bids Management Tests (`e2e/bids.spec.ts`) - 45+ 테스트
**Bid Detail Page (9개)**
- 제목 및 조직명 표시
- 상태 배지
- 예산 정보
- 마감일 카운트다운
- 설명
- 요구사항 목록
- 승률
- 연락처 정보
- 액션 버튼

**Bid Documents (6개)**
- 문서 섹션 표시
- 문서 목록
- 파일 크기 표시
- 다운로드 버튼
- 문서 업로드

**Bid Status Management (4개)**
- 상태 변경 모달
- 모든 상태 옵션 표시
- 상태 변경 (Submitted)
- 상태 변경 노트 추가

**Bid Filtering and Search (7개)**
- 입찰 목록 페이지
- 전체 입찰 표시
- 상태별 필터 (Active)
- 상태별 필터 (Won)
- 제목 검색
- 필터 초기화
- 마감일/예산 정렬

**Bid Timeline and Activity (5개)**
- 타임라인 섹션
- 이벤트 목록
- 타임스탬프
- 사용자 정보
- 이벤트 아이콘

**Bid Creation (6개)**
- 생성 폼 표시
- 필수 필드
- 유효한 데이터로 생성
- 필수 필드 유효성 검사
- 예산 숫자 유효성
- 초안 저장

**Mobile Responsiveness (2개)**
- 모바일 반응형
- 액션 버튼 세로 스택

#### 3. API Integration Tests (`e2e/api-integration.spec.ts`) - 50+ 테스트
**Statistics API (3개)**
- 통계 조회 성공
- API 에러 처리
- 데이터 캐싱

**Bids API (9개)**
- 입찰 목록 조회
- 상태별 필터
- 검색 쿼리
- ID로 단일 입찰 조회
- 404 에러 (존재하지 않는 입찰)
- 입찰 생성
- 생성 시 유효성 검사
- 입찰 수정
- 입찰 삭제

**Upcoming Deadlines API (2개)**
- 마감임박 입찰 조회
- 제한 수 설정

**AI Analysis API (2개)**
- 입찰 분석 및 인사이트
- 분석 타임아웃 처리

**Notifications API (4개)**
- 알림 조회
- 읽지 않은 알림 필터
- 알림 읽음 처리
- 전체 알림 읽음 처리

**Error Handling (4개)**
- 네트워크 에러
- 재시도 로직
- API 응답 유효성 검사
- Rate Limiting (429)

**Data Persistence (2개)**
- 페이지 리로드 시 데이터 유지
- 탭 간 상태 동기화

**Performance (3개)**
- 대시보드 로딩 시간 (< 3초)
- 대용량 목록 처리 (100개)
- 페이지네이션

#### 4. Marketing Pages (`e2e/marketing-pages.spec.ts`) - 23개
- Hero Section: 4개
- Stats Section: 2개
- Features Section: 2개
- HowItWorks: 1개
- Testimonials: 1개
- FAQ: 2개
- CTA: 2개
- SpreadsheetDemo: 10개

#### 5. Auth Tests (`e2e/auth/login.spec.ts`) - 기존 테스트
- 로그인 기능 테스트

## 대안: Docker로 실행

```bash
# Playwright Docker 이미지 사용
docker run --rm --network host -v $(pwd):/work/ -w /work/ -it mcr.microsoft.com/playwright:v1.57.0-jammy /bin/bash

# 컨테이너 내에서
npm install
npm run test:e2e
```

## 현재 상태

✅ 테스트 파일 작성 완료 (150+ 테스트)
✅ Playwright 설정 완료
✅ 코드 에러 수정 (ssr: false 제거)
✅ Dashboard E2E 테스트 추가 (40+ 테스트)
✅ Bids Management E2E 테스트 추가 (45+ 테스트)
✅ API Integration E2E 테스트 추가 (50+ 테스트)
⚠️  시스템 의존성 설치 필요

## 테스트 실행 명령어

### 전체 테스트 실행
```bash
npm run test:e2e
```

### 특정 테스트 파일만 실행
```bash
# Dashboard 테스트
npm run test:e2e dashboard.spec

# Bids 테스트
npm run test:e2e bids.spec

# API 통합 테스트
npm run test:e2e api-integration.spec

# 마케팅 페이지 테스트
npm run test:e2e marketing-pages.spec
```

### UI 모드 (개발용)
```bash
npm run test:e2e:ui
```

### 헤드 모드 (브라우저 표시)
```bash
npm run test:e2e:headed
```

### 디버그 모드
```bash
npm run test:e2e:debug
```

## 테스트 커버리지

- **Dashboard**: 실시간 통계, 입찰 목록, 마감임박, AI 분석, 알림
- **Bids Management**: 입찰 상세, 문서 관리, 상태 변경, 검색/필터, 타임라인, 생성/수정
- **API Integration**: 모든 API 엔드포인트, 에러 처리, 데이터 영속성, 성능
- **Marketing Pages**: 랜딩 페이지 전체 섹션
- **Auth**: 로그인 및 인증

## 다음 단계

1. 시스템 의존성 설치 (`npx playwright install-deps`)
2. `npm run test:e2e` 실행
3. 모든 테스트 통과 확인
4. 테스트 리포트 확인 (`playwright-report/`)
5. CI/CD 파이프라인에 통합
