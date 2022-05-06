FROM node:16.14.0-bullseye

RUN mkdir -p /app

WORKDIR /app

# update npm
RUN npm install -g npm

RUN npm config set cache /tmp --global

CMD ["/bin/bash"]