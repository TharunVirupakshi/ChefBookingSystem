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


async function saveFCMToken(id, token) {
    await redisClient.set(`fcm_token_${id}`, token);
    console.log(`🔑 Saved FCM token for ${id}`);
}
async function getFCMToken(id) {
    return await redisClient.get(`fcm_token_${id}`);
}

module.exports = {
    acquireLock,
    releaseLock,
    updateChefStatus,
    getChefStatus,
    saveFCMToken,
    getFCMToken
};