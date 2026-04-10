# Usa o Node 20 (versão atual recomendada)
FROM node:20-alpine AS base

# Passo 1: Instala os pacotes necessários
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Passo 2: Faz o "Build" (transforma o código em site de verdade)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Passo 3: Cria a versão final bem leve para o site carregar rápido
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
