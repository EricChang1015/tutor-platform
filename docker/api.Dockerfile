# NestJS API Dockerfile
FROM node:18-alpine

# 安裝編譯工具（bcrypt 需要）
RUN apk add --no-cache python3 make g++

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY apps/api/package*.json ./

# 安裝所有依賴（包括開發依賴）
RUN npm install && npm cache clean --force

# 複製應用程式碼
COPY apps/api/ .

# 建構應用程式
RUN npm run build

# 暴露端口
EXPOSE 3001

# 啟動命令（開發模式）
CMD ["npm", "run", "start:dev"]
