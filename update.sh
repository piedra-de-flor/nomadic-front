#!/bin/bash

# Nomadic Front 업데이트 스크립트 (빠른 업데이트용)
# 사용법: ./update.sh

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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 설정 변수
PROJECT_NAME="nomadic-front"
PROJECT_DIR="/var/www/html/$PROJECT_NAME"

log_info "🔄 Nomadic Front 빠른 업데이트 시작..."

# 프로젝트 디렉토리로 이동
cd $PROJECT_DIR

# Git 업데이트
log_info "📥 최신 코드 가져오는 중..."
sudo git fetch origin
sudo git reset --hard origin/master
log_success "코드 업데이트 완료"

# 의존성 업데이트 (필요한 경우)
log_info "📦 의존성 확인 중..."
sudo npm install --legacy-peer-deps --force
log_success "의존성 확인 완료"

# 웹 빌드 재생성
log_info "🏗️ 웹 빌드 재생성 중..."
sudo npx expo export --platform web
log_success "빌드 완료"

# 파일 권한 설정
sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR

# Nginx 재시작
log_info "🔄 Nginx 재시작 중..."
sudo systemctl reload nginx
log_success "Nginx 재시작 완료"

log_success "🎉 업데이트 완료!"
echo ""
echo "🌐 사이트가 업데이트되었습니다: http://YOUR_EC2_IP"
