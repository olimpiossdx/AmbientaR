FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0
RUN apk add --no-cache libc6-compat

# 1. Dependências
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# 2. Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Ignora o erro de chave de IA durante o build para não travar
ENV GOOGLE_GENAI_API_KEY=temporary_key 
RUN npm run build

# 3. Imagem Final
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=9002
# Rotas /api (uploads, inventário, IA) ativas na imagem; sobrescreva no Cloud Run se precisar.
ENV ENABLE_NEXT_API_ROUTES=true
ENV ENABLE_AI_ROUTES=true

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 9002
CMD ["node", "server.js"]
