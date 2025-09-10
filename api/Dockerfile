FROM node:20-alpine
#
WORKDIR /app

# 安裝系統工具（可選：為了便於除錯）
RUN apk add --no-cache bash

# 先複製 package 檔並安裝依賴（利用快取）
COPY package*.json ./
RUN npm ci

# 再複製其餘檔案
COPY . .

# 生成 Prisma Client（確保 @prisma/client 可用）
# 若沒有 prisma/schema.prisma，這裡會失敗；請確認檔案存在
RUN npx prisma generate

# 預設開發模式啟動（watch）
CMD ["npx", "nest", "start", "--watch"]
