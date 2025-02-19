FROM node:20.14.0 AS build

WORKDIR /app

# install pnpm
RUN corepack enable

COPY ./package.json .
COPY ./pnpm-lock.yaml .

RUN pnpm install --frozen-lockfile

COPY ./tsconfig.json .
COPY ./src ./src

RUN pnpm build

RUN npm pkg delete scripts.prepare

RUN pnpm prune --prod

FROM node:20.14.0-slim AS production

RUN apt update && apt install -y wget ffmpeg python3   \
    && wget -O /usr/local/bin/yt-dlp https://github.com/yt-dlp/yt-dlp/releases/download/2025.02.19/yt-dlp && chmod +x /usr/local/bin/yt-dlp  \
    && apt remove -y wget && apt clean

WORKDIR /app

RUN chown node:node /app

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node ./assets ./assets

USER node

ENV TZ="Asia/Taipei"
ENV DEBUG=false
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]