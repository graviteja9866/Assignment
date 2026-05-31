const Redis = require('ioredis');
const config = require('../config');

let redis = null;

function getRedis() {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

async function connectRedis() {
  const client = getRedis();
  if (client.status !== 'ready') {
    await client.connect();
  }
  return client;
}

module.exports = { getRedis, connectRedis };
