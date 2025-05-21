import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let redisClient: Redis;

if (redisUrl) {
  console.log('Connecting to Redis with URL...');
  redisClient = new Redis(redisUrl, {
    // Recommended options for Upstash or other cloud Redis providers
    tls: redisUrl.startsWith('rediss://') ? {} : undefined, // Enable TLS if rediss://
    lazyConnect: true, // Connect only when a command is issued
    maxRetriesPerRequest: 3, // Retry commands a few times on network issues
    connectTimeout: 10000, // 10 seconds
    // KeepAlive settings for long-lived connections
    keepAlive: 30000, // Send PING every 30s
    // Add error handling to see issues
    reconnectOnError: err => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return true;
      }
      // Otherwise, do not reconnect
      return false;
    },
  });

  redisClient.on('connect', () => {
    console.log('Successfully connected to Redis.');
  });

  redisClient.on('error', err => {
    console.error('Redis Client Error:', err);
    // You might want to add more robust error handling or process exit logic here
    // depending on how critical Redis is to your application.
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
