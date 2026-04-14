FROM node:20-alpine AS base

WORKDIR /app

# Build tools for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

# ── Engine build ─────────────────────────────────────────
FROM base AS engine-build

COPY packages/engine/package.json ./engine/
RUN cd engine && npm install

COPY packages/engine ./engine
RUN cd engine && npx prisma generate --schema=prisma/schema.prisma
RUN cd engine && npm run build

# ── UI build ─────────────────────────────────────────────
FROM base AS ui-build

COPY packages/ui/package.json ./ui/
RUN cd ui && npm install

COPY packages/ui ./ui
# Tell Next.js the engine URL at build time (used for server-side fetches if any)
ENV NEXT_PUBLIC_ENGINE_URL=http://localhost:7842
RUN cd ui && npm run build

# ── Final image ───────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++
RUN npm install -g pm2

# Copy engine
COPY --from=engine-build /app/engine/dist ./engine/dist
COPY --from=engine-build /app/engine/generated ./engine/generated
COPY --from=engine-build /app/engine/prisma ./engine/prisma
COPY --from=engine-build /app/engine/node_modules ./engine/node_modules
COPY --from=engine-build /app/engine/package.json ./engine/package.json

# Copy UI
COPY --from=ui-build /app/ui/.next ./ui/.next
COPY --from=ui-build /app/ui/public ./ui/public
COPY --from=ui-build /app/ui/node_modules ./ui/node_modules
COPY --from=ui-build /app/ui/package.json ./ui/package.json

# pm2 config
COPY docker/pm2.config.js ./pm2.config.js

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

EXPOSE 7842 3004

# Run migrations then start both processes
CMD sh -c "cd /app/engine && DATABASE_URL=file:/app/data/raceguard.db npx prisma migrate deploy --schema=prisma/schema.prisma 2>/dev/null || true && pm2-runtime /app/pm2.config.js"
