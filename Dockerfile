# React Native 앱을 위한 Dockerfile
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (의존성 충돌 해결)
RUN npm install --legacy-peer-deps

# 소스 코드 복사
COPY . .

# Expo CLI 및 터널 관련 패키지 설치
RUN npm install -g @expo/cli @expo/ngrok

# 포트 노출 (Expo 개발 서버용)
EXPOSE 19000 19001 19002 8081

# 개발 서버 시작 (터널 모드)
CMD ["npx", "expo", "start", "--tunnel"]
