FROM node:20.9 AS build

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

FROM node:20.9 As production

WORKDIR /app

RUN chown node:node /app

COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node ./src ./src
COPY --chown=node:node ./assets ./assets

USER node

ENV TZ="Asia/Taipei"
ENV DEBUG=false
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]