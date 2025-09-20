#!/bin/bash

# Nomadic Front 배포 스크립트
# 사용법: ./deploy.sh

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 설정 변수
PROJECT_NAME="nomadic-front"
PROJECT_DIR="/var/www/html/$PROJECT_NAME"
GIT_REPO="https://github.com/piedra-de-flor/nomadic-front.git"
NGINX_SITE_CONFIG="/etc/nginx/sites-available/$PROJECT_NAME"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/$PROJECT_NAME"
BACKUP_DIR="/var/backups/$PROJECT_NAME"

log_info "🚀 Nomadic Front 배포 시작..."

# 1. 백업 디렉토리 생성
log_info "📁 백업 디렉토리 생성..."
sudo mkdir -p $BACKUP_DIR

# 2. 기존 프로젝트 백업 (존재하는 경우)
if [ -d "$PROJECT_DIR" ]; then
    log_info "💾 기존 프로젝트 백업 중..."
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    sudo cp -r $PROJECT_DIR $BACKUP_DIR/$BACKUP_NAME
    log_success "백업 완료: $BACKUP_DIR/$BACKUP_NAME"
fi

# 3. 프로젝트 디렉토리 생성 및 이동
log_info "📂 프로젝트 디렉토리 설정..."
sudo mkdir -p /var/www/html
cd /var/www/html

# 4. Git 저장소 클론 또는 업데이트
if [ -d "$PROJECT_DIR" ]; then
    log_info "🔄 기존 저장소 업데이트 중..."
    cd $PROJECT_DIR
    sudo git fetch origin
    sudo git reset --hard origin/master
    log_success "저장소 업데이트 완료"
else
    log_info "📥 저장소 클론 중..."
    sudo git clone $GIT_REPO $PROJECT_NAME
    cd $PROJECT_NAME
    log_success "저장소 클론 완료"
fi

# 5. 의존성 설치
log_info "📦 의존성 설치 중..."
sudo npm install
log_success "의존성 설치 완료"

# 6. 웹 빌드 생성
log_info "🏗️ 웹 빌드 생성 중..."
sudo npx expo export --platform web
log_success "웹 빌드 완료"

# 7. 파일 권한 설정
log_info "🔐 파일 권한 설정 중..."
sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR
log_success "파일 권한 설정 완료"

# 8. Nginx 설정 파일 생성
log_info "⚙️ Nginx 설정 생성 중..."
sudo tee $NGINX_SITE_CONFIG > /dev/null <<EOF
server {
    listen 80;
    server_name _;  # 모든 도메인 허용
    
    root $PROJECT_DIR/dist;
    index index.html;
    
    # Gzip 압축 활성화
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # SPA 라우팅 지원
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 로그 설정
    access_log /var/log/nginx/$PROJECT_NAME.access.log;
    error_log /var/log/nginx/$PROJECT_NAME.error.log;
}
EOF

# 9. Nginx 사이트 활성화
log_info "🔗 Nginx 사이트 활성화 중..."
if [ -L "$NGINX_SITE_ENABLED" ]; then
    sudo rm $NGINX_SITE_ENABLED
fi
sudo ln -s $NGINX_SITE_CONFIG $NGINX_SITE_ENABLED

# 10. Nginx 설정 테스트 및 재시작
log_info "🧪 Nginx 설정 테스트 중..."
if sudo nginx -t; then
    log_success "Nginx 설정 테스트 통과"
    log_info "🔄 Nginx 재시작 중..."
    sudo systemctl reload nginx
    log_success "Nginx 재시작 완료"
else
    log_error "Nginx 설정 테스트 실패"
    exit 1
fi

# 11. 방화벽 설정 (UFW 사용 시)
log_info "🔥 방화벽 설정 확인 중..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 'Nginx Full'
    log_success "방화벽 설정 완료"
fi

# 12. 배포 완료 정보 출력
log_success "🎉 배포 완료!"
echo ""
echo "=========================================="
echo "📋 배포 정보"
echo "=========================================="
echo "프로젝트: $PROJECT_NAME"
echo "디렉토리: $PROJECT_DIR"
echo "웹 루트: $PROJECT_DIR/dist"
echo "Nginx 설정: $NGINX_SITE_CONFIG"
echo ""
echo "🌐 접속 방법:"
echo "1. EC2 퍼블릭 IP: http://YOUR_EC2_IP"
echo "2. 도메인 설정 시: http://YOUR_DOMAIN"
echo ""
echo "📝 유용한 명령어:"
echo "- Nginx 상태 확인: sudo systemctl status nginx"
echo "- Nginx 로그 확인: sudo tail -f /var/log/nginx/$PROJECT_NAME.error.log"
echo "- 프로젝트 재배포: ./deploy.sh"
echo "=========================================="

# 13. 서비스 상태 확인
log_info "🔍 서비스 상태 확인 중..."
if systemctl is-active --quiet nginx; then
    log_success "✅ Nginx가 정상적으로 실행 중입니다"
else
    log_warning "⚠️ Nginx가 실행되지 않고 있습니다"
fi

log_success "🚀 배포 스크립트 실행 완료!"
