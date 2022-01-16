# YueJS

## About

This is a TypeScript rewrite version of my Discord bot Yue. Yue was using in NCU CSIE Discord Server and World of Warships guild PTT NiceBoat. It made so much fun. But the library used by Yue is no longer maintance([detail](https://gist.github.com/Rapptz/4a2f62751b9600a31a0d3c78100287f1)). In fact, the origin one which written by Python might not work properly in the soon future, so I decide to write a new one with [discord.js](https://github.com/discordjs/discord.js/).

## Installation

### Clone The Repository

```shell
git clone https://github.com/ppodds/YueTS.git
```

### Set Configuration and Envirment variables

config files at `config`

`bot.json`

```json
{
    "name": "Bot name",
    "statusList": ["a", "list", "of", "status"],
    "statusType": "Bot status type, either 'PLAYING', 'LISTENING' or 'WATCHING'",
    "token": "your token. you can get it on Developer portal",
    "env": "dev or prod",
    "dev": {
        "clientId": "123456789",
        "guildId": "123456789"
    },
    "author": {
        "avatar": "author avator url"
    }
}
```

`db.json`

```json
{
    "host": "localhost",
    "port": 3306,
    "user": "Yue",
    "password": "test",
    "database": "Yue"
}
```

`log.json`

```json
{
    "appenders": {
        "bot": { "type": "file", "filename": "/var/log/yue/bot.log" }
    },
    "categories": { "default": { "appenders": ["bot"], "level": "info" } }
}
```

env files

`bot.env`

```
BASE_PATH=/app
TZ=Asia/Taipei
DEBUG=true
```

db.env

```
MYSQL_DATABASE=Yue
MYSQL_USER=Yue
MYSQL_PASSWORD=test
MARIADB_ROOT_PASSWORD=test
TZ=Asia/Taipei
```

Note:
Change `"host": "localhost"` as `"host": "database"` if you are using docker!

### Run With Docker

#### Development

```shell
cd YueTS
docker-compose up -d --build
docker exec -it yue bash
npm install
npm run build
npm run dev
```

#### Deploy

##### docker compose

```shell
cd YueTS
docker-compose -f "prod.docker-compose.yml" up -d --build
```

##### docker run

```
docker build --pull --rm -f "prod.dockerfile" -t yuets:latest "."
docker run -d yuets:latest -v ./logs:/var/log/yue --name yuets
```

## FAQ

### Privileged Intent Error

```
Privileged intent provided is not enabled or whitelisted.
```

Try to enable options below
![Discord Bot Portal Intents](docs/intent.png)

### Get an error when deploy commands

If you get the error below, check your `bot.json` set `clientId` and `token` properly.

```
DiscordAPIError[20012]: You are not authorized to perform this action on this application
    at SequentialHandler.runRequest (/app/node_modules/@discordjs/rest/dist/lib/handlers/SequentialHandler.js:198:23)
    at processTicksAndRejections (node:internal/process/task_queues:96:5)
    at async SequentialHandler.queueRequest (/app/node_modules/@discordjs/rest/dist/lib/handlers/SequentialHandler.js:99:20)
    at async /app/deploy-commands.js:29:13 {
  rawError: {
    message: 'You are not authorized to perform this action on this application',
    code: 20012
  },
  code: 20012,
  status: 403,
  method: 'put',
  url: 'https://discord.com/api/v9/applications/??????????????????/commands'
}
```
