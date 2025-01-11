const redisClient = require('../config/redisCache')

async function acquireLock(key, ttl = 30) {
    const result = await redisClient.set(key, 'locked', { NX: true, EX: ttl });
    return result === 'OK';  // Lock acquired if OK
}

async function releaseLock(key) {
    await redisClient.del(key);
}

async function updateChefStatus(chefId, status) {
    await redisClient.set(`chef_status_${chefId}`, status);
}

async function getChefStatus(chefId) {
    return await redisClient.get(`chef_status_${chefId}`);
}

module.exports = {
    acquireLock,
    releaseLock,
    updateChefStatus,
    getChefStatus
};