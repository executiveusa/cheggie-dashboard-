FROM node:20-alpine AS base
RUN npm install -g pnpm@8
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY apps/render/package.json apps/render/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @cheggie/shared build
RUN pnpm --filter @cheggie/render build

FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@8
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/render/package.json apps/render/
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/render/dist apps/render/dist
EXPOSE 3003
CMD ["node", "apps/render/dist/index.js"]
