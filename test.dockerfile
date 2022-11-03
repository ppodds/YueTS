FROM node:16.14.0-bullseye

WORKDIR /app

RUN npm i -g pnpm

COPY . /app

RUN pnpm i

ENV TEST=true

CMD ["/bin/bash"]