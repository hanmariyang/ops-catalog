FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* 는 build time 에 client bundle 에 inline 됨.
# prod backend 도메인 hardcode (Railway 도메인은 안정적). 변경 시 이 줄 수정 후 redeploy.
ENV NEXT_PUBLIC_API_URL=https://backend-production-1959.up.railway.app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
CMD ["npm", "run", "start"]
