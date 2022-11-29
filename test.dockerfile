FROM node:16.14.0-bullseye

WORKDIR /app

RUN apt update && apt install python -y

RUN npm i -g pnpm

COPY . /app

RUN pnpm i

ENV TEST=true

CMD ["/bin/bash"]