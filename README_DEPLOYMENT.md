# Nomadic Front AWS EC2 배포 가이드

## 📋 사전 준비사항

### 1. EC2 인스턴스 설정
- Ubuntu 20.04 LTS 이상 권장
- 최소 t3.medium 인스턴스 (2GB RAM)
- 보안 그룹에서 포트 80, 443, 22 열기

### 2. 필수 소프트웨어 설치
```bash
# Node.js 18.x 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# npm 최신 버전으로 업데이트
sudo npm install -g npm@latest

# Expo CLI 설치
sudo npm install -g @expo/cli

# PM2 설치 (프로세스 관리용)
sudo npm install -g pm2

# Nginx 설치 (웹 서버용)
sudo apt update
sudo apt install nginx

# Git 설치 (없는 경우)
sudo apt install git
```

## 🚀 배포 방법

### 1. 배포 스크립트 다운로드
```bash
# 홈 디렉토리로 이동
cd ~

# 배포 스크립트 다운로드 (GitHub에서 직접)
wget https://raw.githubusercontent.com/piedra-de-flor/nomadic-front/master/deploy.sh
wget https://raw.githubusercontent.com/piedra-de-flor/nomadic-front/master/update.sh
wget https://raw.githubusercontent.com/piedra-de-flor/nomadic-front/master/ecosystem.config.js

# 실행 권한 부여
chmod +x deploy.sh update.sh
```

### 2. 초기 배포 실행
```bash
# 전체 배포 실행
./deploy.sh
```

### 3. 업데이트 배포 (코드 변경 후)
```bash
# 빠른 업데이트
./update.sh
```

## 📁 배포 구조

```
/var/www/html/nomadic-front/     # 프로젝트 루트
├── dist/                        # 웹 빌드 결과물
├── src/                         # 소스 코드
├── package.json                 # 의존성
└── ...

/etc/nginx/sites-available/      # Nginx 설정
└── nomadic-front

/var/backups/nomadic-front/      # 백업 파일들
└── backup_YYYYMMDD_HHMMSS/
```

## 🔧 관리 명령어

### Nginx 관리
```bash
# Nginx 상태 확인
sudo systemctl status nginx

# Nginx 재시작
sudo systemctl restart nginx

# Nginx 설정 테스트
sudo nginx -t

# 로그 확인
sudo tail -f /var/log/nginx/nomadic-front.error.log
```

### PM2 관리 (개발 모드 사용 시)
```bash
# PM2로 앱 시작
pm2 start ecosystem.config.js

# PM2 상태 확인
pm2 status

# PM2 로그 확인
pm2 logs nomadic-front

# PM2 재시작
pm2 restart nomadic-front

# PM2 중지
pm2 stop nomadic-front
```

### 백업 관리
```bash
# 백업 목록 확인
ls -la /var/backups/nomadic-front/

# 오래된 백업 삭제 (30일 이상)
find /var/backups/nomadic-front/ -type d -mtime +30 -exec rm -rf {} \;
```

## 🌐 접속 방법

### HTTP 접속
- **EC2 퍼블릭 IP**: `http://YOUR_EC2_PUBLIC_IP`
- **도메인 설정 시**: `http://YOUR_DOMAIN`

### HTTPS 설정 (권장)
```bash
# Let's Encrypt 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급 (도메인이 있는 경우)
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정
sudo crontab -e
# 다음 줄 추가: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐛 문제 해결

### 1. 빌드 실패
```bash
# Node.js 버전 확인
node --version

# npm 캐시 정리
sudo npm cache clean --force

# node_modules 재설치
sudo rm -rf node_modules package-lock.json
sudo npm install
```

### 2. Nginx 502 에러
```bash
# Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/error.log

# 파일 권한 확인
ls -la /var/www/html/nomadic-front/dist/

# 권한 수정
sudo chown -R www-data:www-data /var/www/html/nomadic-front
sudo chmod -R 755 /var/www/html/nomadic-front
```

### 3. 포트 충돌
```bash
# 포트 사용 확인
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000

# 프로세스 종료
sudo kill -9 PID_NUMBER
```

## 📊 모니터링

### 시스템 리소스 모니터링
```bash
# CPU, 메모리 사용량
htop

# 디스크 사용량
df -h

# 네트워크 연결
sudo netstat -tlnp
```

### 로그 모니터링
```bash
# 실시간 로그 확인
sudo tail -f /var/log/nginx/nomadic-front.access.log
sudo tail -f /var/log/nginx/nomadic-front.error.log
```

## 🔄 자동 배포 설정

### GitHub Webhook 설정 (고급)
1. GitHub 저장소에서 Settings > Webhooks
2. Payload URL: `http://YOUR_EC2_IP/webhook`
3. Content type: `application/json`
4. Webhook 스크립트 생성 필요

### Cron을 이용한 정기 배포
```bash
# crontab 편집
sudo crontab -e

# 매일 새벽 2시에 자동 업데이트
0 2 * * * /home/ubuntu/update.sh >> /var/log/auto-update.log 2>&1
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. EC2 보안 그룹 설정
2. Nginx 설정 파일 문법
3. 파일 권한 설정
4. 로그 파일 내용

---

**배포 완료 후**: `http://YOUR_EC2_PUBLIC_IP`로 접속하여 사이트가 정상 작동하는지 확인하세요.
