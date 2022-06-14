FROM node:16.14.0-bullseye

RUN mkdir -p /app

WORKDIR /app

# update npm
RUN npm install -g npm

# install TypeScript
RUN npm install -g typescript

# general package
RUN npm install -g node-gyp

COPY ./package.json /app
COPY ./package-lock.json /app

RUN npm install

COPY ./tsconfig.json /app
COPY ./src /app/src
COPY ./assets /app/assets
COPY ./config /app/config

ENV BASE_PATH="/app"
ENV TZ="Asia/Taipei"
ENV DEBUG=false

CMD ["bash", "-c", "npm run prod"]