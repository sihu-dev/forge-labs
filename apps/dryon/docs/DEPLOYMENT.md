# 배포 가이드

## 목차

- [로컬 실행](#로컬-실행)
- [Docker 배포](#docker-배포)
- [클라우드 배포](#클라우드-배포)
- [환경별 설정](#환경별-설정)
- [모니터링](#모니터링)

---

## 로컬 실행

### 1. 환경 설정

```bash
# 저장소 클론
git clone https://github.com/saucefirstteam/hyein-agent.git
cd hyein-agent

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 API 키 등을 설정
```

### 2. 실행

```bash
# 개발 모드 (hot reload)
npm run dev

# 즉시 실행 (테스트)
npm start

# 프로덕션 빌드
npm run build
npm start
```

---

## Docker 배포

### 1. Docker Compose 사용 (권장)

```bash
# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# Docker Compose로 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f hyein-agent

# 중지
docker-compose down
```

### 2. Docker 직접 사용

```bash
# 이미지 빌드
docker build -t hyein-agent .

# 컨테이너 실행
docker run -d \
  --name hyein-agent \
  --env-file .env \
  -p 3000:3000 \
  hyein-agent

# 로그 확인
docker logs -f hyein-agent

# 중지
docker stop hyein-agent
docker rm hyein-agent
```

### 3. Docker Hub에서 이미지 가져오기

```bash
# 이미지 pull
docker pull saucefirstteam/hyein-agent:latest

# 실행
docker run -d \
  --name hyein-agent \
  --env-file .env \
  saucefirstteam/hyein-agent:latest
```

---

## 클라우드 배포

### AWS EC2

#### 1. EC2 인스턴스 생성

- AMI: Ubuntu 22.04 LTS
- 인스턴스 타입: t3.small 이상 권장
- 보안 그룹: SSH (22), HTTP (80), HTTPS (443) 포트 오픈

#### 2. 서버 설정

```bash
# SSH 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Docker Compose 설치
sudo apt install docker-compose-plugin -y

# 로그아웃 후 재접속
exit
```

#### 3. 애플리케이션 배포

```bash
# 저장소 클론
git clone https://github.com/saucefirstteam/hyein-agent.git
cd hyein-agent

# 환경 변수 설정
nano .env
# 필요한 값들을 입력

# Docker Compose로 실행
docker compose up -d

# 자동 시작 설정
sudo systemctl enable docker
```

#### 4. 로그 로테이션 설정

```bash
# logrotate 설정
sudo nano /etc/logrotate.d/hyein-agent
```

```
/home/ubuntu/hyein-agent/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```

### AWS ECS (Fargate)

#### 1. ECR에 이미지 푸시

```bash
# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 빌드
docker build -t hyein-agent .

# 태그
docker tag hyein-agent:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/hyein-agent:latest

# 푸시
docker push \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/hyein-agent:latest
```

#### 2. ECS 태스크 정의 생성

```json
{
  "family": "hyein-agent",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "hyein-agent",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/hyein-agent:latest",
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/hyein-agent",
          "awslogs-region": "ap-northeast-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Run

```bash
# gcloud CLI 인증
gcloud auth login

# 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# 이미지 빌드 및 푸시
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/hyein-agent

# Cloud Run 배포
gcloud run deploy hyein-agent \
  --image gcr.io/YOUR_PROJECT_ID/hyein-agent \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest
```

### Heroku

```bash
# Heroku CLI 로그인
heroku login

# 앱 생성
heroku create hyein-agent

# 환경 변수 설정
heroku config:set ANTHROPIC_API_KEY=your_key
heroku config:set NODE_ENV=production

# 배포
git push heroku main

# 로그 확인
heroku logs --tail
```

---

## 환경별 설정

### Development

```env
NODE_ENV=development
DEBUG=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

### Staging

```env
NODE_ENV=staging
DEBUG=true
LOG_LEVEL=info
SCHEDULER_CRON=0 9 * * *  # 매일 오전 9시
```

### Production

```env
NODE_ENV=production
DEBUG=false
VERBOSE_LOGGING=false
LOG_LEVEL=info
SCHEDULER_CRON=0 8 * * *  # 매일 오전 8시
```

---

## 모니터링

### 로그 확인

```bash
# Docker 로그
docker logs -f hyein-agent

# 로컬 로그 파일
tail -f logs/app.log

# 에러 로그만 보기
tail -f logs/app.log | grep ERROR
```

### 헬스체크

```bash
# 컨테이너 상태 확인
docker ps -a | grep hyein-agent

# 프로세스 확인
docker exec hyein-agent ps aux
```

### Slack 알림

시스템 오류 발생시 자동으로 Slack 알림이 전송됩니다.

### 리소스 모니터링

```bash
# CPU/메모리 사용량
docker stats hyein-agent

# 디스크 사용량
df -h
```

---

## 백업 및 복구

### 데이터 백업

```bash
# 로그 백업
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/

# 환경 변수 백업
cp .env .env.backup
```

### 복구

```bash
# 이전 버전으로 롤백
docker pull saucefirstteam/hyein-agent:previous-tag
docker-compose down
docker-compose up -d
```

---

## 트러블슈팅

### 컨테이너가 시작되지 않을 때

```bash
# 로그 확인
docker logs hyein-agent

# 환경 변수 확인
docker exec hyein-agent env

# 컨테이너 재시작
docker restart hyein-agent
```

### API 키 오류

- `.env` 파일의 API 키 확인
- 공공데이터포털에서 API 활성화 상태 확인
- Anthropic Console에서 API 키 유효성 확인

### 메모리 부족

```bash
# 메모리 할당 증가
docker run -m 2g hyein-agent
```

---

## 보안 고려사항

1. **환경 변수 관리**
   - `.env` 파일을 Git에 커밋하지 마세요
   - AWS Secrets Manager, Google Secret Manager 사용 권장

2. **방화벽 설정**
   - 필요한 포트만 오픈
   - SSH는 특정 IP만 허용

3. **정기 업데이트**
   - 의존성 정기 업데이트
   - 보안 패치 적용

---

## 성능 최적화

1. **캐싱 활성화**
   - Redis 설정하여 API 응답 캐싱

2. **Rate Limiting 조정**
   - API 호출 제한 최적화

3. **병렬 처리**
   - Worker 수 조정

---

## 문의

배포 관련 문제가 있으신가요?
- GitHub Issues: https://github.com/saucefirstteam/hyein-agent/issues
- Email: support@saucefirst.com
