# ─────────────────────────────────────────────
# LÄYRD – layrd-ecommerce (Next.js) production image
# Multi-stage build: install deps once, build once, then copy only the
# standalone output into a clean final image (much smaller + faster to
# start than shipping the full source + node_modules).
# ─────────────────────────────────────────────

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time env vars (e.g. NEXT_PUBLIC_*) are read from .env.local by
# Next.js itself during `next build` — no extra wiring needed here.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
