import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let redisClient: Redis;

if (redisUrl) {
  console.log('Connecting to Redis with URL...');
  redisClient = new Redis(redisUrl, {
    tls: redisUrl.startsWith('rediss://') ? {} : undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    keepAlive: 30000,
    reconnectOnError: err => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

  redisClient.on('connect', () => {
    console.log('Successfully connected to Redis.');
  });

  redisClient.on('error', err => {
    console.error('Redis Client Error:', err);
  });
} else {
  console.warn('REDIS_URL not found. Falling back to local Redis instance (if available).');
  // Fallback for local development if REDIS_URL is not set
  redisClient = new Redis({
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    keepAlive: 30000,
  });

  redisClient.on('connect', () => {
    console.log('Successfully connected to LOCAL Redis.');
  });
  redisClient.on('error', err => {
    console.error('LOCAL Redis Client Error:', err);
  });
}

export default redisClient;
