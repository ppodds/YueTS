FROM node:16.14.0-bullseye

RUN mkdir -p /app

WORKDIR /app

COPY . /app

RUN npm ci

ENV TEST=true

CMD ["/bin/bash"]