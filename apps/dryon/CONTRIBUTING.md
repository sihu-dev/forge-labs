# 기여 가이드 (Contributing Guide)

Hyein Agent 프로젝트에 기여해주셔서 감사합니다! 🎉

## 시작하기

1. **Fork** 이 저장소를 Fork 하세요
2. **Clone** Fork한 저장소를 로컬에 클론하세요
   ```bash
   git clone https://github.com/YOUR_USERNAME/hyein-agent.git
   cd hyein-agent
   ```
3. **Install** 의존성을 설치하세요
   ```bash
   npm install
   ```

## 개발 워크플로우

### 1. 브랜치 생성

새로운 기능이나 버그 수정을 위해 브랜치를 생성하세요:

```bash
git checkout -b feature/amazing-feature
# 또는
git checkout -b fix/bug-description
```

### 브랜치 네이밍 컨벤션

- `feature/` - 새로운 기능
- `fix/` - 버그 수정
- `docs/` - 문서 업데이트
- `refactor/` - 코드 리팩토링
- `test/` - 테스트 추가/수정
- `chore/` - 기타 작업

### 2. 코드 작성

#### 코드 스타일

- ESLint와 Prettier 설정을 따르세요
- TypeScript 타입을 적극 활용하세요
- 명확하고 의미있는 변수/함수명을 사용하세요

#### 커밋 메시지 컨벤션

```
<type>: <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (코드 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스, 도구 설정 등

**예시:**
```
feat: Claude API를 통한 적합도 분석 기능 추가

- ClaudeAgent 클래스 구현
- 적합도 점수 계산 로직 추가
- 평가기준 파싱 기능 추가

Closes #123
```

### 3. 테스트

모든 테스트가 통과하는지 확인하세요:

```bash
# 전체 테스트 실행
npm test

# 특정 테스트 실행
npm test -- analyzer

# 커버리지 확인
npm test -- --coverage
```

새로운 기능을 추가할 때는 테스트도 함께 작성해주세요.

### 4. 코드 품질 체크

```bash
# Lint 검사
npm run lint

# Lint 자동 수정
npm run lint:fix

# Prettier 포맷팅
npm run format

# 타입 체크
npm run typecheck
```

### 5. Pull Request 생성

1. 변경사항을 커밋하세요
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

2. Fork한 저장소에 푸시하세요
   ```bash
   git push origin feature/amazing-feature
   ```

3. GitHub에서 Pull Request를 생성하세요

## Pull Request 가이드라인

### PR 체크리스트

- [ ] 코드가 프로젝트의 코딩 스타일을 따릅니다
- [ ] 자체 리뷰를 수행했습니다
- [ ] 필요한 경우 주석을 추가했습니다
- [ ] 문서를 업데이트했습니다
- [ ] 모든 테스트가 통과합니다
- [ ] 새로운 경고가 발생하지 않습니다
- [ ] 테스트를 추가했습니다 (새로운 기능인 경우)

### PR 설명

PR에는 다음 내용을 포함해주세요:

1. **변경 사항 요약**: 무엇을 변경했는지
2. **변경 이유**: 왜 이 변경이 필요한지
3. **테스트 방법**: 어떻게 테스트했는지
4. **관련 이슈**: 관련 이슈 번호 (있는 경우)

## 버그 리포트

버그를 발견하셨나요? Issue를 생성해주세요:

1. [Bug Report 템플릿](https://github.com/saucefirstteam/hyein-agent/issues/new?template=bug_report.md) 사용
2. 재현 방법을 명확히 작성
3. 예상 동작과 실제 동작 설명
4. 환경 정보 포함 (OS, Node.js 버전 등)

## 기능 제안

새로운 기능을 제안하고 싶으신가요?

1. [Feature Request 템플릿](https://github.com/saucefirstteam/hyein-agent/issues/new?template=feature_request.md) 사용
2. 기능이 필요한 이유 설명
3. 제안하는 솔루션 설명
4. 대안도 함께 고려

## 코드 리뷰 프로세스

1. 최소 1명의 maintainer 승인이 필요합니다
2. 모든 CI 체크가 통과해야 합니다
3. 코드 리뷰 피드백에 적극적으로 대응해주세요
4. 승인 후 maintainer가 merge합니다

## 개발 환경 설정

### 필수 요구사항

- Node.js 20+
- npm 10+
- Git

### 권장 도구

- VSCode (권장 에디터)
- VSCode Extensions:
  - ESLint
  - Prettier
  - TypeScript
  - Docker (Docker 개발시)

### 환경 변수 설정

개발 시 `.env` 파일을 생성하세요:

```bash
cp .env.example .env
# .env 파일을 열어 필요한 값들을 설정
```

## 질문이 있으신가요?

- Issue를 통해 질문해주세요
- [GitHub Discussions](https://github.com/saucefirstteam/hyein-agent/discussions)에서 토론하세요

## 행동 강령

- 서로를 존중하고 배려해주세요
- 건설적인 피드백을 주고받아주세요
- 다양한 의견과 경험을 환영합니다

## 라이선스

이 프로젝트에 기여함으로써, 귀하의 기여가 프로젝트와 동일한 [MIT 라이선스](LICENSE)에 따라 라이선스됨에 동의합니다.

---

다시 한번 기여해주셔서 감사합니다! 🙏
