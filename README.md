# YueJS

## About

This is a TypeScript rewrite version of my Discord bot Yue. Yue was using in NCU CSIE Discord Server and World of Warships guild PTT NiceBoat. It made so much fun. But the library used by Yue is no longer maintance([detail](https://gist.github.com/Rapptz/4a2f62751b9600a31a0d3c78100287f1)). In fact, the origin one which written by Python might not work properly in the soon future, so I decide to write a new one with [discord.js](https://github.com/discordjs/discord.js/).

## Installation

**Node.js 16.6.0 or newer is required.**

### Clone The Repository

```shell
git clone https://github.com/ppodds/YueTS.git
```

### Setup Envirment Variables

### Run With Docker

#### Development

If you run this first time

```shell
cd YueTS
docker-compose up -d --build
docker exec -it yue bash
npm install
npm run build
npm run dev
```

or

```shell
cd YueTS
docker-compose up -d --build
docker exec -it yue bash
npm run build
npm run dev
```
