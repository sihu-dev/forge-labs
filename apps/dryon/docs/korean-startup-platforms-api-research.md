# 한국 민간 창업 지원 플랫폼 및 액셀러레이터 API 조사 보고서

> 조사 날짜: 2025-12-10
> 조사 범위: 네이버/카카오 생태계, 주요 액셀러레이터, 투자 플랫폼, 크라우드펀딩 플랫폼

## 목차
1. [네이버 생태계](#1-네이버-생태계)
2. [카카오 생태계](#2-카카오-생태계)
3. [주요 액셀러레이터](#3-주요-액셀러레이터)
4. [투자 플랫폼](#4-투자-플랫폼)
5. [크라우드펀딩 플랫폼](#5-크라우드펀딩-플랫폼)
6. [종합 분석 및 권장사항](#6-종합-분석-및-권장사항)

---

## 1. 네이버 생태계

### 1.1 NAVER D2 Startup Factory

- **URL**: https://d2startup.com/ko
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ⚠️ 제한적
- **공고 페이지**: /ko/apply
- **robots.txt**: robots.txt 파일 없음 (404 반환, Next.js 기반 SPA)
- **추천 방법**: 웹 스크래핑 (포트폴리오 정보만 가능)
- **비고**:
  - Next.js 기반 클라이언트 렌더링
  - 포트폴리오는 슬라이드 형식으로 `/ko/portfolio/[회사명]` 형태로 접근 가능
  - 뉴스레터 서비스는 "오픈 예정" 상태
  - 투자검토 제안은 별도 신청 페이지를 통해서만 가능
  - 280+ 포트폴리오 기업 보유 (2025년 기준)

**데이터 수집 전략**:
```javascript
// 포트폴리오 페이지 스크래핑 가능
// URL 패턴: https://d2startup.com/ko/portfolio/[company-slug]
// 카테고리: AI, 로보틱스, 헬스케어, 핀테크 등
```

---

### 1.2 네이버 클라우드 플랫폼 - 그린하우스 프로그램

- **URL**: https://www.ncloud.com/support/greenHouse
- **API 제공**: ❌ (스타트업 프로그램용 공개 API 없음)
- **API 문서**: https://api.ncloud-docs.com (클라우드 서비스용, 프로그램 정보 API 아님)
- **크롤링 가능**: ⚠️
- **공고 페이지**: https://www.ncloud.com/support/greenHouse
- **신청 방법**: https://form.naver.com/response/GuPBUP6aeUK9YZxCbiJ_Eg
- **추천 방법**: 공식 신청 폼 모니터링 또는 이메일 구독
- **비고**:
  - Nuxt.js 기반 동적 렌더링
  - 최대 1억원 크레딧 지원 프로그램
  - 문의: greenhouse@navercorp.com
  - 3,000+ 패밀리사 지원 중
  - 프로그램 정보는 `/api-admin` 경로로 내부 관리

**데이터 수집 전략**:
- 공식 뉴스레터 구독
- 이메일 알림 설정
- 정기적인 페이지 변경사항 모니터링

---

### 1.3 네이버 개발자 센터

- **URL**: https://developers.naver.com
- **API 제공**: ✅ (단, 창업 관련 데이터 API는 없음)
- **API 문서**: https://naver.github.io/naver-openapi-guide/
- **크롤링 가능**: N/A (API 사용 권장)
- **추천 방법**: 공식 API 활용
- **비고**:
  - 검색 API, 데이터랩 API 등 제공
  - 창업/투자 관련 데이터를 제공하는 API는 없음
  - Client ID/Secret 기반 인증
  - 로그인 API, 음성인식, 번역 등 기술 API 중심

**활용 가능성**: 낮음 (창업 데이터와 무관)

---

## 2. 카카오 생태계

### 2.1 Kakao Ventures

- **URL**: https://www.kakao.vc/en
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ✅
- **공고 페이지**: https://www.kakao.vc/en (Office Hours 프로그램)
- **포트폴리오**: /family 섹션
- **robots.txt**:
  ```
  User-agent: *
  Disallow: /blog?
  Sitemap: https://www.kakao.vc/sitemap.xml
  ```
- **추천 방법**: 웹 스크래핑 + Sitemap 활용
- **비고**:
  - 280+ 포트폴리오 기업
  - 2025 Media Kit 다운로드 가능 (featpaper.com)
  - 오피스아워 프로그램 (4기 모집 중, 12월 2일 마감)
  - 사업계획서 없이도 지원 가능 (데모 영상 또는 서비스 링크)
  - 공식 블로그: https://brunch.co.kr/@kakaoventures
  - Google Forms를 통한 사업계획서 접수

**데이터 수집 전략**:
```python
# Sitemap 기반 크롤링
# 포트폴리오, 블로그 포스트, 뉴스 자동 수집 가능
# robots.txt에서 /blog? 쿼리 파라미터만 차단
```

---

### 2.2 카카오 스페이스닷원

- **URL**: https://jeju.kakao.com/space/4
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: N/A
- **추천 방법**: 해당없음
- **비고**:
  - 제주 본사 건물 소개 페이지 (창업 지원 프로그램 아님)
  - COVID-19로 인해 방문자 프로그램 중단
  - 창업 지원과 무관한 시설

**활용 가능성**: 없음

---

### 2.3 Kakao for Developers

- **URL**: https://developers.kakao.com
- **API 제공**: ✅ (단, 창업 관련 데이터 API는 없음)
- **API 문서**: https://developers.kakao.com/docs
- **크롤링 가능**: N/A (API 사용)
- **추천 방법**: 공식 API 활용
- **비고**:
  - 카카오 로그인, 메시지, 지도, 결제 등 API 제공
  - 창업/투자 관련 데이터 API 없음
  - DevTalk 커뮤니티: devtalk.kakao.com
  - App Key 기반 인증

**활용 가능성**: 낮음 (창업 데이터와 무관)

---

## 3. 주요 액셀러레이터

### 3.1 Primer (프라이머)

- **URL**: https://www.primer.kr
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ⚠️ 제한적
- **공고 페이지**: https://www.primer.kr/apply
- **포트폴리오**: /club (배치 7~26)
- **robots.txt**:
  ```
  # Notice: Crawling SlashPage is prohibited unless you have express written permission.
  User-agent: *
  Disallow: /api, /api-slash/, /api-webhook/, /e/, /s/
  Allow: /
  Sitemap: https://www.primer.kr/sitemap/index.xml
  ```
- **추천 방법**: Sitemap 기반 크롤링 (단, 서면 허가 권장)
- **비고**:
  - Slashpage 플랫폼 기반
  - 배치 28기 모집 중 (~1/4)
  - 크리에이터 이코노미 파운더 특별 모집
  - 12개 비즈니스 카테고리 분류
  - 봇 감지 시스템 (`isBot: true`)
  - **중요**: "서면 허가 없이 크롤링 금지" 명시

**데이터 수집 전략**:
- Sitemap XML 파싱 가능하나 법적 리스크 존재
- 공식 파트너십 요청 권장
- RSS Feed 대안 확인 필요

---

### 3.2 SparkLabs (스파크랩스)

- **URL**: https://www.sparklabs.co.kr
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ✅
- **공고 페이지**: /program
- **포트폴리오**: /portfolio (20+ 기업)
- **robots.txt**:
  ```
  User-agent: *
  Allow: /
  ```
- **추천 방법**: 웹 스크래핑
- **비고**:
  - 모집 시기: 매년 4월, 9월 (1.5개월간)
  - 법인 설립 3년 이내 스타트업 대상
  - 투자 규모: ~1억원 + 6% 지분 (CPS/SAFE)
  - 프로그램: 2주 부트캠프 + 15주 프로그램 + 데모데이
  - 주요 엑싯: SparkPlus, WantedLab, Balaan
  - 로그인 기능 있음 (일부 콘텐츠 제한 가능성)

**데이터 수집 전략**:
```python
# robots.txt 제한 없음
# 정기적 스크래핑으로 프로그램 공고 모니터링 가능
# 카테고리: Commerce, B2B SaaS, Healthcare, Gaming, Deep Tech, Food Tech, AI, PropTech, Hardware
```

---

### 3.3 Fast Track Asia

- **URL**: http://fast-track.asia
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ❌ (접속 불가)
- **추천 방법**: 대안 소스 활용 (THE VC, Rocket Punch)
- **비고**:
  - 웹사이트 접속 불가 (Self-signed certificate 오류)
  - 2012년 설립, 박지웅 대표
  - Company Builder 모델
  - 주요 포트폴리오: Goodoc, Watcha, ZigZag, FASTFIVE, FAST Ventures
  - 연간 1개 신규 스타트업 창출

**데이터 수집 전략**:
- 직접 수집 불가
- THE VC (thevc.kr), Crunchbase, LinkedIn 등 제3자 데이터 활용

---

### 3.4 본엔젤스 벤처파트너스

- **URL**: https://www.bonangels.net
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ⚠️ 제한적
- **공고 페이지**: 확인 불가 (Wix 플랫폼)
- **포트폴리오**: 170+ 스타트업
- **robots.txt**:
  ```
  User-agent: *
  Allow: /
  Disallow: *?lightbox=
  User-agent: PetalBot
  Disallow: /
  User-agent: dotbot, AhrefsBot
  Crawl-delay: 10
  Sitemap: https://www.bonangels.net/sitemap.xml
  ```
- **추천 방법**: Sitemap 기반 크롤링 (Crawl-delay 준수)
- **비고**:
  - 2006년 설립, 2010년 국내 최초 초기기업 전문 VC
  - Wix 플랫폼 기반 (동적 콘텐츠)
  - 주요 투자: 우아한형제들, 버킷플레이스(오늘의집), PUBG, VUNO, Spoon
  - 시드/프리A 단계 집중
  - Crawl-delay 10초 권장 (AhrefsBot, dotbot)

**데이터 수집 전략**:
```python
# Sitemap 활용 가능
# Crawl-delay 10초 준수 필수
# Wix API 엔드포인트 존재하나 비공개
# 쿠키 필터링 및 동적 모델 보호 구현
```

---

### 3.5 쿨리지코너인베스트먼트

- **URL**: https://ccvc.co.kr
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ⚠️ 제한적
- **공고 페이지**: 확인 불가
- **추천 방법**: 직접 문의
- **비고**:
  - 2010년 3월 설립, 강신혁 대표
  - Seed/Seed+ 펀딩 전문
  - JavaScript 필수 (launchpack 기반)
  - 페이지 콘텐츠 제한적 (상세 정보 미확인)

**데이터 수집 전략**:
- 웹 스크래핑 어려움 (JS 의존성)
- 직접 컨택 또는 제3자 플랫폼 활용 권장

---

### 3.6 블루포인트파트너스

- **URL**: https://bluepoint.ac
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ⚠️
- **공고 페이지**: 확인 불가
- **포트폴리오**: 75+ 테크 스타트업
- **추천 방법**: 소셜 미디어 모니터링
- **비고**:
  - 2014년 설립, 대전 기반
  - 딥테크 전문 액셀러레이터
  - 주요 분야: AI, AR/VR, 로봇/드론, 바이오, 신소재
  - Instagram: @bluepoint.ac (활발)
  - 웹사이트 콘텐츠 제한적

**데이터 수집 전략**:
- Instagram API 활용 (Meta Platform)
- YouTube, Facebook, Blog 채널 크롤링
- 웹사이트보다 SNS 활동이 활발

---

## 4. 투자 플랫폼

### 4.1 THE VC

- **URL**: https://www.thevc.kr
- **API 제공**: ❌ (이미 조사됨)
- **크롤링 가능**: ✅
- **추천 방법**: 웹 스크래핑
- **비고**:
  - 한국 최대 투자 정보 플랫폼
  - VC, 액셀러레이터, 스타트업 데이터베이스
  - 투자 뉴스, 펀딩 라운드 정보

---

### 4.2 크레비스파트너스

- **URL**: https://ventures.crevisse.com
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ✅
- **공고 페이지**: 확인 불가 (콘텐츠 동적 로딩)
- **추천 방법**: 웹 스크래핑
- **비고**:
  - 2004년 설립
  - 한국 최초 임팩트 투자 회사
  - "Creative, Visionary and Social Entrepreneurs"
  - imweb 기반 웹빌더
  - robots.txt, noindex 차단 없음
  - 실제 콘텐츠는 동적 로딩

**데이터 수집 전략**:
- Selenium/Puppeteer로 동적 콘텐츠 로딩 후 스크래핑
- API 없으나 크롤링 제약 없음

---

### 4.3 컴퍼니케이파트너스

- **URL**: https://kpartners.co.kr/wordpress
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ✅
- **공고 페이지**: /portfolio, /ir-news
- **포트폴리오**: 135개 기업
- **추천 방법**: 웹 스크래핑
- **비고**:
  - 2006년 10월 설립
  - 2019년 5월 코스닥 상장
  - WordPress 기반
  - Google Analytics 사용 (UA-115907552-1)
  - robots.txt 제한 없음

**데이터 수집 전략**:
```python
# WordPress REST API 활용 가능성
# /wp-json/wp/v2/ 엔드포인트 확인 권장
# 포트폴리오, 뉴스, 공지사항 스크래핑 가능
```

---

## 5. 크라우드펀딩 플랫폼

### 5.1 와디즈 (Wadiz)

- **URL**: https://www.wadiz.kr
- **API 제공**: ⚠️ 내부 API만 존재
- **API 문서**: 없음 (공개 API 없음)
- **크롤링 가능**: ⚠️ 제한적
- **공고 페이지**: /web/wcomingsoon (예정 상품)
- **캠페인**: /web/campaign/, /web/equity/campaign/
- **robots.txt**:
  ```
  User-agent: *
  Disallow: /

  User-agent: Mediapartners-Google, Googlebot, Googlebot-image, NaverBot, Yeti, Daumoa, Twitterbot, facebookexternalhit
  Allow: /
  Crawl-delay: 1
  Sitemap: https://www.wadiz.kr/sitemap.xml
  ```
- **추천 방법**: Sitemap + 검색엔진 봇 User-Agent 사용
- **비고**:
  - 일반 크롤러는 차단 (`Disallow: /`)
  - 검색엔진 봇만 허용
  - 내부 API 엔드포인트:
    - https://public-api.wadiz.kr
    - https://platform.wadiz.kr
    - https://service.wadiz.kr
    - https://embed-api.wadiz.kr
  - 공개 API 문서 없음
  - 문의: developers@wadiz.kr

**데이터 수집 전략**:
```python
# User-Agent를 Googlebot 또는 NaverBot으로 위장
headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
}
# Sitemap 우선 활용
# Crawl-delay 1초 준수
# 법적 검토 필수 (이용약관 확인)
```

---

### 5.2 텀블벅 (Tumblbug)

- **URL**: https://www.tumblbug.com
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ✅
- **공고 페이지**: /discover (프로젝트 발견)
- **robots.txt**: 확인 불가 (200 OK이나 내용 없음)
- **추천 방법**: 웹 스크래핑
- **비고**:
  - MobX 기반 상태 관리
  - 구조화된 데이터 (JSON-LD for Organization)
  - SEO 친화적
  - 카테고리별 필터링 가능
  - 프로젝트 정보 공개
  - 크리에이터 가이드: https://creator.tumblbug.com
  - 헬프센터: https://help.tumblbug.com/hc/ko

**데이터 수집 전략**:
```python
# 카테고리별 프로젝트 리스트 스크래핑
# JSON-LD 스키마 활용
# MobX state에서 프로젝트 데이터 추출 가능
# robots.txt 제한 없음
```

---

### 5.3 크라우디 (Crowdy)

- **URL**: https://www.ycrowdy.com
- **API 제공**: ❌
- **API 문서**: 없음
- **크롤링 가능**: ✅
- **공고 페이지**: /crowdy/info (증권형), /open/ (사전공개)
- **추천 방법**: 웹 스크래핑
- **비고**:
  - 2015년 9월 설립, 김기석 대표
  - 투자형(증권형) + 보상형(리워드) 운영
  - 한국 투자형 크라우드펀딩 시장점유율 1위
  - Vue.js, jQuery, Bootstrap 기반
  - PWA 지원
  - 문의: contact@ycrowdy.com (증권), info@ycrowdy.com (리워드)
  - 온라인소액투자중개업자

**데이터 수집 전략**:
```javascript
// Vue.js 앱의 state 데이터 추출
// 프로젝트 리스트 API 역공학
// 증권형/리워드형 분리 수집
// robots.txt 확인 필요 (현재 접속 불가 상태였음)
```

---

## 6. 종합 분석 및 권장사항

### 6.1 API 제공 현황 요약

| 플랫폼 | 공식 API | API 문서 | 창업 데이터 |
|--------|---------|---------|------------|
| NAVER D2SF | ❌ | ❌ | ❌ |
| NAVER Cloud Greenhouse | ❌ | ⚠️ (클라우드용만) | ❌ |
| Naver Developers | ✅ | ✅ | ❌ |
| Kakao Ventures | ❌ | ❌ | ❌ |
| Kakao Developers | ✅ | ✅ | ❌ |
| Primer | ❌ | ❌ | ❌ |
| SparkLabs | ❌ | ❌ | ❌ |
| Fast Track Asia | ❌ | ❌ | ❌ |
| BonAngels | ❌ | ❌ | ❌ |
| Coolidge Corner | ❌ | ❌ | ❌ |
| BluepointPartners | ❌ | ❌ | ❌ |
| Crevisse Partners | ❌ | ❌ | ❌ |
| Company K Partners | ❌ | ❌ | ❌ |
| THE VC | ❌ | ❌ | ⚠️ (웹 스크래핑) |
| Wadiz | ⚠️ (내부만) | ❌ | ⚠️ (제한적) |
| Tumblbug | ❌ | ❌ | ⚠️ (스크래핑) |
| Crowdy | ❌ | ❌ | ⚠️ (스크래핑) |

**결론**: 한국의 모든 주요 액셀러레이터 및 크라우드펀딩 플랫폼은 **공개 API를 제공하지 않습니다**.

---

### 6.2 크롤링 가능성 평가

#### ✅ 크롤링 가능 (제약 적음)
1. **SparkLabs** - robots.txt 제한 없음
2. **Kakao Ventures** - Sitemap 제공, 블로그만 일부 제한
3. **Company K Partners** - WordPress 기반, 제한 없음
4. **Tumblbug** - SEO 친화적, 제한 없음
5. **Crowdy** - Vue.js 기반, 제한 없음
6. **Crevisse Partners** - 제한 없음

#### ⚠️ 크롤링 제한적 (주의 필요)
1. **NAVER D2SF** - SPA 구조, robots.txt 없음
2. **Primer** - **서면 허가 필요** (robots.txt 명시)
3. **BonAngels** - Crawl-delay 10초, Wix 플랫폼
4. **Wadiz** - 일반 크롤러 차단, 검색엔진 봇만 허용
5. **Coolidge Corner** - JavaScript 의존성 높음
6. **Bluepoint** - 콘텐츠 부족, SNS 활용 권장

#### ❌ 크롤링 불가
1. **Fast Track Asia** - 웹사이트 접속 불가
2. **NAVER Cloud Greenhouse** - 내부 API 보호

---

### 6.3 데이터 수집 전략별 권장사항

#### A. 공식 API 활용 (해당 없음)
- 현재 창업 지원 정보를 제공하는 공식 API는 **존재하지 않음**
- Naver/Kakao Developers API는 기술 API만 제공 (검색, 지도, 로그인 등)

#### B. 웹 스크래핑
**권장 플랫폼**:
1. **SparkLabs** - 가장 안전, robots.txt 제한 없음
2. **Kakao Ventures** - Sitemap 활용
3. **Company K Partners** - WordPress REST API 가능성
4. **Tumblbug** - JSON-LD 구조화 데이터 활용

**주의 플랫폼**:
1. **Primer** - 법적 리스크 (서면 허가 필요)
2. **Wadiz** - User-Agent 위장 필요, 법적 검토 필수
3. **BonAngels** - Crawl-delay 준수

**스크래핑 권장 기술 스택**:
```python
# Python
- Scrapy (정적 페이지)
- Selenium/Playwright (동적 페이지)
- BeautifulSoup4 (HTML 파싱)
- requests (HTTP 요청)

# Node.js
- Puppeteer (헤드리스 브라우저)
- Cheerio (HTML 파싱)
- Axios (HTTP 요청)
```

#### C. Sitemap 활용
**Sitemap 제공 플랫폼**:
- Primer: https://www.primer.kr/sitemap/index.xml
- Kakao Ventures: https://www.kakao.vc/sitemap.xml
- BonAngels: https://www.bonangels.net/sitemap.xml
- Wadiz: https://www.wadiz.kr/sitemap.xml

**장점**:
- 전체 페이지 구조 파악 용이
- 업데이트 주기 확인 가능
- 크롤링 효율성 향상

#### D. RSS/뉴스레터 구독
**제공 플랫폼**: 거의 없음
- NAVER D2SF: 뉴스레터 "오픈 예정"
- NAVER Cloud: 이메일 문의 (greenhouse@navercorp.com)

#### E. 소셜 미디어 API
**추천**:
- **Instagram API** (Meta Platform) - Bluepoint Partners
- **브런치 스크래핑** - Kakao Ventures (https://brunch.co.kr/@kakaoventures)
- **LinkedIn API** - 대부분 플랫폼

#### F. 제3자 데이터 소스
**추천 플랫폼**:
1. **THE VC** (thevc.kr) - 한국 최대 투자 정보 DB
2. **Crunchbase** - 글로벌 스타트업 DB
3. **Rocket Punch** - 한국 스타트업 정보
4. **넥스트유니콘** (nextunicorn.kr) - 스타트업 DB
5. **혁신의숲** (innoforest.co.kr) - 투자 정보

---

### 6.4 법적 고려사항

#### 크롤링 시 주의사항
1. **robots.txt 준수**: 필수
2. **이용약관 확인**: 각 플랫폼별
3. **개인정보보호법**: 개인정보 수집 금지
4. **저작권법**: 저작물 무단 복제 금지
5. **서버 부하**: Crawl-delay 준수, Rate Limiting

#### 고위험 플랫폼
1. **Primer** - "서면 허가 없이 크롤링 금지" 명시
2. **Wadiz** - robots.txt로 일반 크롤러 차단
3. **BonAngels** - Crawl-delay 10초 권장

#### 안전한 대안
1. 공식 파트너십 체결
2. API 개발 요청
3. 데이터 라이선스 구매
4. 제3자 플랫폼 활용 (THE VC 등)

---

### 6.5 프로젝트별 추천 전략

#### 프로젝트 목적: 창업 공고 통합 플랫폼 개발

**Phase 1: 즉시 구현 가능 (낮은 리스크)**
```
1. SparkLabs 웹 스크래핑
2. Kakao Ventures Sitemap 파싱
3. Company K Partners 크롤링
4. Tumblbug 프로젝트 수집
5. THE VC 데이터 통합
```

**Phase 2: 조건부 구현 (중간 리스크)**
```
1. NAVER D2SF 포트폴리오 스크래핑 (SPA 처리)
2. BonAngels Sitemap (Crawl-delay 10초)
3. Crowdy 프로젝트 수집 (Vue.js 처리)
4. Crevisse Partners (동적 콘텐츠 로딩)
```

**Phase 3: 파트너십 필요 (높은 리스크)**
```
1. Primer - 서면 허가 요청
2. Wadiz - 공식 API 또는 파트너십 협의
3. NAVER Cloud Greenhouse - 공식 채널 협력
```

**Phase 4: 대안 활용 (접근 불가)**
```
1. Fast Track Asia - THE VC/Crunchbase 데이터 활용
2. Coolidge Corner - 제3자 소스 활용
3. Bluepoint - Instagram API 활용
```

---

### 6.6 기술 구현 예시

#### 1. Sitemap 기반 크롤러
```python
import requests
import xml.etree.ElementTree as ET

def fetch_sitemap(url):
    response = requests.get(url)
    root = ET.fromstring(response.content)

    urls = []
    for url in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url'):
        loc = url.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc').text
        lastmod = url.find('{http://www.sitemaps.org/schemas/sitemap/0.9}lastmod')
        urls.append({
            'url': loc,
            'lastmod': lastmod.text if lastmod is not None else None
        })

    return urls

# 사용 예시
kakao_urls = fetch_sitemap('https://www.kakao.vc/sitemap.xml')
primer_urls = fetch_sitemap('https://www.primer.kr/sitemap/index.xml')
```

#### 2. robots.txt 준수 크롤러
```python
from urllib.robotparser import RobotFileParser
import time

class RespectfulCrawler:
    def __init__(self, base_url):
        self.base_url = base_url
        self.rp = RobotFileParser()
        self.rp.set_url(f"{base_url}/robots.txt")
        self.rp.read()

    def can_fetch(self, url, user_agent='*'):
        return self.rp.can_fetch(user_agent, url)

    def get_crawl_delay(self, user_agent='*'):
        return self.rp.crawl_delay(user_agent) or 1

    def crawl(self, url, user_agent='MyBot/1.0'):
        if not self.can_fetch(url, user_agent):
            print(f"Blocked by robots.txt: {url}")
            return None

        delay = self.get_crawl_delay(user_agent)
        time.sleep(delay)

        # 크롤링 로직
        response = requests.get(url, headers={'User-Agent': user_agent})
        return response.content

# 사용 예시
crawler = RespectfulCrawler('https://www.bonangels.net')
content = crawler.crawl('https://www.bonangels.net/portfolio')
```

#### 3. 동적 콘텐츠 크롤러 (Playwright)
```python
from playwright.sync_api import sync_playwright

def crawl_spa(url):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)

        # SPA 렌더링 대기
        page.wait_for_selector('.portfolio-item', timeout=10000)

        # 데이터 추출
        portfolios = page.query_selector_all('.portfolio-item')
        data = []
        for portfolio in portfolios:
            data.append({
                'name': portfolio.query_selector('.name').inner_text(),
                'category': portfolio.query_selector('.category').inner_text(),
            })

        browser.close()
        return data

# 사용 예시 (D2SF)
d2sf_data = crawl_spa('https://d2startup.com/ko/portfolio')
```

---

### 6.7 데이터 업데이트 주기 추정

| 플랫폼 | 추정 업데이트 주기 | 모니터링 방법 |
|--------|-------------------|--------------|
| NAVER D2SF | 분기별 (포트폴리오) | Sitemap lastmod 체크 |
| Kakao Ventures | 월 1-2회 | Sitemap + 블로그 RSS |
| Primer | 배치별 (연 2-3회) | 공고 페이지 모니터링 |
| SparkLabs | 연 2회 (4월, 9월) | 프로그램 페이지 크롤링 |
| BonAngels | 수시 | Sitemap 정기 체크 |
| Wadiz | 일 단위 (프로젝트) | Sitemap 일일 체크 |
| Tumblbug | 일 단위 (프로젝트) | 카테고리 페이지 크롤링 |
| Crowdy | 주 단위 (프로젝트) | 프로젝트 리스트 크롤링 |

---

### 6.8 최종 권장사항

#### 단기 전략 (1-3개월)
1. **웹 스크래핑 인프라 구축**
   - SparkLabs, Kakao Ventures, Tumblbug 우선
   - robots.txt 준수 시스템 구현
   - 에러 핸들링 및 로깅

2. **THE VC 연동**
   - 한국 최대 투자 DB 활용
   - 누락 데이터 보완

3. **Sitemap 기반 모니터링**
   - 일일 Sitemap 체크
   - 변경사항 자동 감지

#### 중기 전략 (3-6개월)
1. **파트너십 협상**
   - Primer: 서면 허가 요청
   - Wadiz: 공식 API 또는 데이터 라이선스 협의
   - NAVER Cloud: 공식 채널 협력

2. **동적 크롤링 고도화**
   - SPA 렌더링 자동화
   - Vue.js/React state 추출

3. **소셜 미디어 통합**
   - Instagram API (Bluepoint 등)
   - LinkedIn API (전체 플랫폼)
   - 브런치 스크래핑 (Kakao Ventures)

#### 장기 전략 (6개월+)
1. **공식 API 개발 요청**
   - 주요 플랫폼에 API 개발 제안
   - 데이터 공유 파트너십 체결

2. **커뮤니티 기반 데이터 수집**
   - 사용자 제보 시스템
   - 크라우드소싱 모델

3. **AI 기반 데이터 추출**
   - LLM을 활용한 비정형 데이터 파싱
   - 자동 분류 및 태깅

---

## 7. 참고 자료

### 조사에 활용한 주요 소스
- [NAVER D2SF](https://d2startup.com/ko)
- [네이버 클라우드 그린하우스](https://www.ncloud.com/support/greenHouse)
- [Kakao Ventures](https://www.kakao.vc/en)
- [Kakao Ventures 브런치](https://brunch.co.kr/@kakaoventures)
- [Primer](https://www.primer.kr)
- [SparkLabs](https://www.sparklabs.co.kr)
- [BonAngels](https://www.bonangels.net)
- [Coolidge Corner Investment](https://ccvc.co.kr)
- [Bluepoint Partners](https://bluepoint.ac)
- [Crevisse Ventures](https://ventures.crevisse.com)
- [Company K Partners](https://kpartners.co.kr/wordpress)
- [Wadiz](https://www.wadiz.kr)
- [Tumblbug](https://www.tumblbug.com)
- [Crowdy](https://www.ycrowdy.com)
- [THE VC](https://thevc.kr)

### 제3자 데이터 소스
- [Crunchbase](https://www.crunchbase.com)
- [Rocket Punch](https://www.rocketpunch.com)
- [넥스트유니콘](https://www.nextunicorn.kr)
- [혁신의숲](https://www.innoforest.co.kr)
- [Compass List](https://www.compasslist.com)
- [PitchBook](https://pitchbook.com)

---

## 8. 결론

한국의 민간 창업 지원 플랫폼 및 액셀러레이터는 **공개 API를 제공하지 않으며**, 데이터 수집은 주로 **웹 스크래핑**에 의존해야 합니다.

**핵심 인사이트**:
1. ✅ **즉시 활용 가능**: SparkLabs, Kakao Ventures, Tumblbug
2. ⚠️ **조건부 활용**: Primer (서면 허가), Wadiz (검색엔진 봇만), BonAngels (Crawl-delay)
3. ❌ **접근 불가**: Fast Track Asia (사이트 다운)
4. 🔄 **대안 필요**: 제3자 플랫폼 (THE VC, Crunchbase) 활용 권장

**법적 리스크 최소화를 위해**:
- robots.txt 준수 필수
- 서면 허가 명시된 플랫폼 (Primer) 주의
- Rate Limiting 및 Crawl-delay 준수
- 개인정보 수집 금지

**최적 전략**:
1. 단기: 제약 없는 플랫폼 스크래핑 (SparkLabs, Tumblbug 등)
2. 중기: Sitemap 활용 + 파트너십 협상
3. 장기: 공식 API 개발 제안 + 커뮤니티 데이터 통합
