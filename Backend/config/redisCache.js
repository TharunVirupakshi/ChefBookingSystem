const Redis = require('redis');

const redisClient = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Connect to Redis
redisClient.connect();

redisClient.on('connect', () => {
    console.log('[INFO] Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('[ERROR] Redis connection failed:', err);
});

module.exports = redisClient;
