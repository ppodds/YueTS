FROM node:16.14-bullseye AS build

WORKDIR /app

RUN apt update && apt install python -y

# install pnpm
RUN npm install -g pnpm

COPY --chown=node:node ./package.json /app
COPY --chown=node:node ./pnpm-lock.yaml /app

RUN pnpm install --frozen-lockfile

COPY ./tsconfig.json /app
COPY ./src /app/src

RUN pnpm build

RUN npm pkg delete scripts.prepare

RUN pnpm prune --prod

FROM node:16.14-bullseye As production

RUN mkdir -p /app

WORKDIR /app

RUN chown node:node /app

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./assets ./assets
COPY --chown=node:node ./config ./config

USER node

ENV BASE_PATH="/app"
ENV TZ="Asia/Taipei"
ENV DEBUG=false

CMD ["node", "dist/index.js"]