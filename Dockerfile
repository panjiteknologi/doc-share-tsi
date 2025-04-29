# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm saja dulu
RUN npm install -g pnpm

# Stage 2: Dependencies
FROM base AS dependencies

# Hanya copy file yang dibutuhkan untuk dependency install
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM dependencies AS build

COPY . .

RUN pnpm build

# Stage 4: Production
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=build /app .

CMD ["node", "dist/index.js"]
