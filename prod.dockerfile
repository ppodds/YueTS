FROM node:16.14.0-bullseye

RUN mkdir -p /app

WORKDIR /app

# update npm
RUN npm install -g npm

# install TypeScript
RUN npm install -g typescript

# general package
RUN npm install -g node-gyp

COPY ./src /app/src
COPY ./config /app/config
COPY ./package.json /app
COPY ./package-lock.json /app
COPY ./tsconfig.json /app

RUN npm install

ENV BASE_PATH="/app"
ENV TZ="Asia/Taipei"
ENV DEBUG=false

CMD ["bash", "-c", "npm run prod"]