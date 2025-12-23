# 🔍 34개 정부지원사업 데이터 소스 전체 조사

**조사 일시**: 2025-12-10
**목표**: API 가능 여부 확인 및 크롤링 전략 수립

---

## 📊 종합 현황

### 정부기관 데이터 소스 (34개)
| 구분 | 개수 | 비율 |
|------|------|------|
| **공식 API 제공** | 4개 | 12% |
| **크롤링 가능** | 26개 | 76% |
| **검색 API 활용** | 3개 | 9% |
| **민간 플랫폼** | 1개 | 3% |
| **총계** | 34개 | 100% |

### 민간 플랫폼 데이터 소스 (17개 추가 조사)
| 구분 | 개수 | 비율 |
|------|------|------|
| **공식 API 제공** | 0개 | 0% |
| **크롤링 즉시 가능** | 6개 | 35% |
| **크롤링 조건부** | 8개 | 47% |
| **접근 불가/제한적** | 3개 | 18% |
| **총계** | 17개 | 100% |

### 전체 통합 (51개 소스)
| 구분 | 개수 |
|------|------|
| **정부기관** | 34개 |
| **민간 플랫폼** | 17개 |
| **총계** | 51개 |

---

## 1️⃣ 정부기관 (7개)

### ✅ API 제공 (2개)

#### 1. Bizinfo (기업마당)
```yaml
소스: 공공데이터포털 API
URL: https://www.data.go.kr/data/15078873/openapi.do
방식: REST API (JSON)
인증: API Key
난이도: ⭐ (쉬움)
승인기간: 1-2일
데이터: 중소벤처기업부 지원사업 공고
업데이트: 실시간
상태: ✅ 구현 완료
```

**샘플 엔드포인트**:
```
GET https://api.odcloud.kr/api/3034791/v1/uddi:fa09d13d-bce8-474e-b214-8008e79ec08f
?serviceKey={API_KEY}
&page=1
&perPage=100
```

#### 2. K-Startup
```yaml
소스: 공공데이터포털 API
URL: https://www.data.go.kr/data/15125364/openapi.do
방식: REST API (JSON)
인증: API Key
난이도: ⭐ (쉬움)
승인기간: 1-2일
데이터: 창업지원 사업공고
업데이트: 실시간
상태: ✅ 구현 완료
```

---

### 🕷️ 크롤링 필요 (5개)

#### 3. KISED (창업진흥원)
```yaml
URL: https://www.kised.or.kr/board.es?mid=a10301000000&bid=0001
방식: 웹 크롤링 (Cheerio)
인증: 불필요
난이도: ⭐⭐ (보통)
데이터: 사업공고 게시판
업데이트: 주 1-2회
셀렉터: .board-list, .notice-item
상태: ⚠️ 개발 필요
```

**크롤링 전략**:
- 게시판 페이징 처리
- 제목, 기간, URL 추출
- 상세페이지에서 내용 파싱

#### 4. NIPA (정보통신산업진흥원)
```yaml
URL: https://www.nipa.kr/main/selectBbsNttList.do?bbsNo=98
방식: 웹 크롤링 (Cheerio)
인증: 불필요
난이도: ⭐⭐⭐ (어려움 - 동적 로딩)
데이터: 사업공고
업데이트: 부정기
문제: JavaScript 동적 렌더링 가능성
해결: Puppeteer 또는 Playwright 필요할 수 있음
상태: ⚠️ 조사 필요
```

#### 5. 중소벤처기업진흥공단
```yaml
URL: https://www.kosmes.or.kr/sbc/SH/SBI/SHSBI001M0.do
방식: 웹 크롤링
난이도: ⭐⭐⭐
데이터: 지원사업 공고
업데이트: 주간
상태: ⚠️ 개발 필요
```

#### 6. 중소벤처기업부 (SMBA)
```yaml
URL: https://www.mss.go.kr/site/smba/main.do
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 정책공고
업데이트: 일간
상태: ⚠️ 개발 필요
```

#### 7. 소상공인24 (SEMAS24)
```yaml
URL: https://www.sbiz.or.kr/sup/supList.do
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 소상공인 지원사업
업데이트: 주간
상태: ⚠️ 개발 필요
```

---

## 2️⃣ 금융기관 (3개)

### 🕷️ 크롤링 (3개)

#### 8. KODIT (기술보증기금)
```yaml
URL: https://www.kibo.or.kr/web/cont/invest/invest01/invest0101.jsp
방식: 웹 크롤링
난이도: ⭐⭐⭐
데이터: 보증 및 투자 프로그램
업데이트: 월간
특이사항: 로그인 필요 가능성
상태: ⚠️ 조사 필요
```

#### 9. KOREG (신용보증기금)
```yaml
URL: https://www.kodit.co.kr/customer/notice.do
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 보증 지원사업
업데이트: 월간
상태: ⚠️ 개발 필요
```

#### 10. IBK기업은행 (KIBO)
```yaml
URL: https://www.ibk.co.kr/
방식: 웹 크롤링
난이도: ⭐⭐⭐
데이터: 창업/중소기업 대출 상품
업데이트: 분기별
상태: ⚠️ 개발 필요
```

---

## 3️⃣ 지자체 (18개)

### 🕷️ 크롤링 (18개)

#### 11. 서울산업진흥원 (SBA)
```yaml
URL: https://www.sba.seoul.kr/kr/sbcu010101
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 서울시 창업지원
업데이트: 주간
상태: ⚠️ 개발 필요
```

#### 12. 경기도창업지원센터
```yaml
URL: https://www.ggsc.or.kr/main/contents.do?menuNo=200174
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 경기도 창업지원
상태: ⚠️ 개발 필요
```

#### 13. 부산창조경제혁신센터
```yaml
URL: https://www.bscic.or.kr/main.do
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 부산 창업지원
상태: ⚠️ 개발 필요
```

#### 14-30. 전국 창조경제혁신센터 (17개)
```yaml
패턴: https://{지역}ccei.creativekorea.or.kr/
방식: 통합 크롤러 (동일 구조)
난이도: ⭐⭐
지역:
  - 강원, 경남, 경북, 광주, 대구, 대전
  - 세종, 울산, 인천, 전남, 전북, 제주
  - 충남, 충북, 포항, 창원, 평택
데이터: 지역별 창업지원 프로그램
업데이트: 주간
전략: 하나의 범용 크롤러로 17개 센터 처리
상태: ⚠️ 범용 크롤러 개발 필요
```

#### 31. 마루180
```yaml
URL: https://www.maru180.com/
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 서울시 스타트업 지원
상태: ⚠️ 개발 필요
```

---

## 4️⃣ 특화 플랫폼 (4개)

### 🕷️ 크롤링 (4개)

#### 32. TIPS
```yaml
URL: https://www.jointips.or.kr/intro/notice/notice01.do
방식: 웹 크롤링
난이도: ⭐⭐
데이터: TIPS 프로그램 공고
업데이트: 분기별
상태: ⚠️ 개발 필요
```

#### 33. K-Global
```yaml
URL: https://www.k-global.kr/main.do
방식: 웹 크롤링
난이도: ⭐⭐⭐
데이터: 글로벌 진출 지원
상태: ⚠️ 개발 필요
```

#### 34. K-PUSH
```yaml
URL: https://www.k-push.or.kr/
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 중소기업 해외진출 지원
상태: ⚠️ 개발 필요
```

#### 35. K-DATA
```yaml
URL: https://www.kdata.or.kr/
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 데이터 산업 지원
상태: ⚠️ 개발 필요
```

---

## 5️⃣ 네이버 생태계 (7개)

### ✅ API 제공 (1개)

#### 36. 네이버 검색 API
```yaml
소스: 네이버 개발자 센터
URL: https://developers.naver.com/docs/serviceapi/search/news/news.md
방식: REST API (JSON)
인증: Client ID + Secret
난이도: ⭐ (쉬움)
승인기간: 즉시
데이터: 실시간 뉴스/블로그에서 "지원사업" 키워드 검색
쿼리: "창업 지원사업", "스타트업 공고" 등
업데이트: 실시간
상태: ⚠️ 개발 필요
```

**샘플 코드**:
```bash
curl "https://openapi.naver.com/v1/search/news.json?query=창업%20지원사업" \
  -H "X-Naver-Client-Id: {CLIENT_ID}" \
  -H "X-Naver-Client-Secret: {CLIENT_SECRET}"
```

### 🕷️ 크롤링 (6개)

#### 37. 네이버 사장님
```yaml
URL: https://smbiz.naver.com/
방식: 웹 크롤링
난이도: ⭐⭐⭐ (동적 페이지)
데이터: 소상공인 지원 정보
카테고리: 창업, 운영, 교육, 금융, 마케팅
상태: ⚠️ 개발 필요
```

#### 38. D2 Startup Factory (D2SF)
```yaml
URL: https://d2sf.naver.com/
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 네이버 D2SF 프로그램
상태: ⚠️ 개발 필요
```

#### 39. 네이버 D2
```yaml
URL: https://d2.naver.com/
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 개발자 지원 프로그램
상태: ⚠️ 개발 필요
```

#### 40. 네이버 Connect
```yaml
URL: https://connect.naver.com/
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 사회공헌/CSR 지원
상태: ⚠️ 개발 필요
```

#### 41. 네이버 CLOVA AI
```yaml
URL: https://clova.ai/ko/research
방식: 웹 크롤링
난이도: ⭐⭐
데이터: AI 연구 지원
상태: ⚠️ 개발 필요
```

---

## 6️⃣ 민간/액셀러레이터 (4개)

### 🔍 검색 API 활용 (4개)

#### 42. 프라이머
```yaml
URL: https://www.primer.kr/
방식: 네이버 검색 API + 크롤링
난이도: ⭐⭐
검색어: "프라이머 모집", "Primer 지원"
상태: ⚠️ 개발 필요
```

#### 43. 매쉬업엔젤스
```yaml
URL: https://www.mashupangels.com/
방식: 네이버 검색 API + 크롤링
난이도: ⭐⭐
검색어: "매쉬업엔젤스 모집"
상태: ⚠️ 개발 필요
```

#### 44. SparkLabs Korea
```yaml
URL: https://www.sparklabskorea.com/
방식: 웹 크롤링
난이도: ⭐⭐
데이터: 액셀러레이팅 프로그램
상태: ⚠️ 개발 필요
```

#### 45. TheVC
```yaml
URL: https://thevc.kr/
방식: 웹 크롤링
난이도: ⭐⭐
데이터: VC 투자 정보
상태: ⚠️ 개발 필요
```

---

## 📊 우선순위 개발 계획

### Phase 1: 즉시 (공식 API) ✅
- [x] Bizinfo API
- [x] K-Startup API
- [ ] 네이버 검색 API

### Phase 2: 주간 (핵심 크롤러)
1. KISED (창업진흥원)
2. NIPA
3. 서울산업진흥원
4. TIPS
5. D2SF

### Phase 3: 월간 (범용 크롤러)
6. 창조경제혁신센터 17개 (통합 크롤러)
7. 금융기관 3개
8. 지자체 나머지

### Phase 4: 분기 (민간)
9. 네이버 생태계 6개
10. 액셀러레이터 4개

---

## 🛠️ 기술 스택

### API 호출
```typescript
axios + zod validation
```

### 정적 크롤링
```typescript
axios + cheerio
```

### 동적 크롤링 (JavaScript 렌더링)
```typescript
puppeteer 또는 playwright
```

### 검색 API
```typescript
네이버 검색 API (뉴스/블로그)
```

---

## ⚠️ 주의사항

### 법적 고려사항
1. **robots.txt 확인 필수**
2. **이용약관 준수**
3. **Rate Limiting 설정** (1-2초 간격)
4. **User-Agent 명시**

### 기술적 고려사항
1. **동적 페이지**: Puppeteer 필요
2. **로그인 필요 사이트**: 제외 또는 수동 수집
3. **CAPTCHA**: 우회 불가, 제외
4. **IP 차단 위험**: Rate Limiting 필수

---

## 📈 예상 수집 결과

| 소스 유형 | 개수 | 예상 공고/월 |
|-----------|------|--------------|
| 공식 API | 2개 | 50-100건 |
| 정부 크롤링 | 5개 | 30-50건 |
| 지자체 | 18개 | 20-30건 |
| 플랫폼 | 4개 | 10-20건 |
| 네이버 검색 | 1개 | 100-200건 |
| 민간 | 4개 | 5-10건 |
| **총계** | **34개** | **215-410건/월** |

---

## 6️⃣ 민간 플랫폼 (17개)

> **⚠️ 중요**: 모든 민간 플랫폼은 **공개 API를 제공하지 않습니다**
>
> 상세 조사 보고서: [korean-startup-platforms-api-research.md](./korean-startup-platforms-api-research.md)

### ✅ 크롤링 즉시 가능 (6개)

#### 1. SparkLabs
```yaml
URL: https://www.sparklabs.co.kr
방식: 웹 크롤링 (Cheerio)
robots.txt: Allow: / (제한 없음)
난이도: ⭐⭐ (보통)
데이터: 프로그램 공고, 포트폴리오
업데이트: 연 2회 (4월, 9월)
모집 규모: ~1억원 + 6% 지분
상태: ✅ 즉시 구현 가능
```

#### 2. Kakao Ventures
```yaml
URL: https://www.kakao.vc
방식: Sitemap 기반 크롤링
robots.txt: Disallow: /blog? (블로그 쿼리만 제한)
Sitemap: https://www.kakao.vc/sitemap.xml
난이도: ⭐ (쉬움)
데이터: 포트폴리오, 오피스아워
업데이트: 월 1-2회
상태: ✅ 즉시 구현 가능
```

#### 3. Tumblbug (텀블벅)
```yaml
URL: https://www.tumblbug.com
방식: 웹 크롤링 (JSON-LD)
robots.txt: 제한 없음
난이도: ⭐ (쉬움)
데이터: 크라우드펀딩 프로젝트
업데이트: 일 단위
구조화: JSON-LD for Organization
상태: ✅ 즉시 구현 가능
```

#### 4. Company K Partners
```yaml
URL: https://kpartners.co.kr/wordpress
방식: 웹 크롤링 (WordPress)
robots.txt: 제한 없음
난이도: ⭐ (쉬움)
데이터: 포트폴리오 (135개), IR 뉴스
업데이트: 수시
가능성: WordPress REST API 활용
상태: ✅ 즉시 구현 가능
```

#### 5. Crowdy (크라우디)
```yaml
URL: https://www.ycrowdy.com
방식: 웹 크롤링 (Vue.js)
robots.txt: 확인 필요
난이도: ⭐⭐ (보통)
데이터: 증권형/리워드형 크라우드펀딩
업데이트: 주 단위
상태: ⚠️ 구현 가능
```

#### 6. Crevisse Partners
```yaml
URL: https://ventures.crevisse.com
방식: 동적 크롤링 (Selenium)
robots.txt: 제한 없음
난이도: ⭐⭐ (보통)
데이터: 임팩트 투자 포트폴리오
상태: ⚠️ 구현 가능
```

---

### ⚠️ 크롤링 조건부 (8개)

#### 7. NAVER D2 Startup Factory
```yaml
URL: https://d2startup.com/ko
방식: SPA 크롤링 (Next.js)
robots.txt: 없음 (404)
난이도: ⭐⭐⭐ (어려움)
데이터: 포트폴리오 (280+ 기업)
문제: 클라이언트 렌더링
해결: Puppeteer/Playwright 필요
상태: ⚠️ 조건부 가능
```

#### 8. Primer (프라이머)
```yaml
URL: https://www.primer.kr
방식: Sitemap 크롤링 (주의!)
robots.txt: "서면 허가 없이 크롤링 금지" 명시
난이도: ⭐⭐⭐ (높은 법적 리스크)
데이터: 배치 프로그램, 포트폴리오
업데이트: 연 2-3회 (배치별)
법적 리스크: ⚠️ 높음 (서면 허가 필요)
권장: 공식 파트너십 요청
상태: 🚫 서면 허가 필수
```

#### 9. Wadiz (와디즈)
```yaml
URL: https://www.wadiz.kr
방식: 검색엔진 봇 위장
robots.txt: Disallow: / (일반 크롤러 차단)
허용: Googlebot, NaverBot만
난이도: ⭐⭐⭐⭐ (높은 법적 리스크)
데이터: 크라우드펀딩, 예정 상품
내부 API: https://public-api.wadiz.kr (비공개)
법적 리스크: ⚠️ 매우 높음
권장: 공식 파트너십 협의
상태: 🚫 법적 검토 필수
```

#### 10. BonAngels Venture Partners
```yaml
URL: https://www.bonangels.net
방식: Sitemap 크롤링 (Wix)
robots.txt: Crawl-delay: 10초 (필수)
난이도: ⭐⭐ (보통)
데이터: 포트폴리오 (170+ 스타트업)
플랫폼: Wix 기반 (동적 콘텐츠)
주의: PetalBot 차단, Crawl-delay 준수
상태: ⚠️ 조건부 가능
```

#### 11-14. 기타 조건부
- **NAVER Cloud Greenhouse**: 동적 렌더링, 내부 API 보호
- **Bluepoint Partners**: 웹사이트 정보 부족, Instagram 활용 권장
- **Coolidge Corner Investment**: JavaScript 의존성 높음
- **THE VC**: 이미 조사됨 (크롤링 가능)

---

### ❌ 접근 불가/제한적 (3개)

#### 15. Fast Track Asia
```yaml
URL: http://fast-track.asia
상태: ❌ 웹사이트 접속 불가
문제: Self-signed certificate 오류
대안: THE VC, Crunchbase 데이터 활용
```

#### 16-17. Kakao/Naver Developers API
```yaml
상태: ❌ 창업 데이터 제공 안함
제공: 기술 API만 (지도, 로그인, 검색 등)
활용 가능성: 없음 (창업 지원과 무관)
```

---

## 📊 민간 플랫폼 수집 전략

### Phase 1: 즉시 구현 (낮은 리스크)
```
✅ SparkLabs 웹 스크래핑
✅ Kakao Ventures Sitemap 파싱
✅ Tumblbug 프로젝트 수집
✅ Company K Partners 크롤링
⚠️ Crowdy 프로젝트 수집
```

### Phase 2: 조건부 구현 (중간 리스크)
```
⚠️ NAVER D2SF (SPA 처리)
⚠️ BonAngels (Crawl-delay 10초)
⚠️ Crevisse Partners (동적 로딩)
```

### Phase 3: 파트너십 필요 (높은 리스크)
```
🚫 Primer - 서면 허가 요청
🚫 Wadiz - 공식 API 협의
❌ Fast Track Asia - 제3자 데이터 활용
```

---

## 🚀 다음 단계

### 정부기관 크롤러
1. ✅ 네이버 검색 API 구현
2. ✅ KISED 크롤러 개발
3. ✅ NIPA 크롤러 개발 (Puppeteer)
4. ✅ 범용 CCEI 크롤러 개발 (17개 센터)
5. ✅ SBA, Finance, Technopark 크롤러 개발
6. ✅ 전체 통합 테스트 완료

### 민간 플랫폼 크롤러
1. 🔨 SparkLabs 크롤러 개발 (Phase 1 우선순위)
2. 🔨 Kakao Ventures Sitemap 파서
3. 🔨 Tumblbug 크롤러
4. ⏳ Primer 파트너십 협의
5. ⏳ Wadiz API 협의
