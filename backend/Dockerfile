# syntax=docker/dockerfile:1.6

# ─── Dependencies (cached layer) ───────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Copy prisma schema so postinstall (prisma generate) works
COPY prisma ./prisma
RUN npm install --no-audit --no-fund

# ─── Build TypeScript ──────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
RUN npx prisma generate && npm run build

# ─── Runtime ───────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only copy what's needed to run
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 4000

# Run migration on container start then launch the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
