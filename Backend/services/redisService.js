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

const updateChefLocation = async (chef_id, latitude, longitude) => {
    const locationKey = `chef:location:${chef_id}`;
    const locationData = JSON.stringify({ latitude, longitude });

    try {
        await redisClient.set(locationKey, locationData);
        console.log(`✅ Chef ${chef_id} location saved: ${latitude}, ${longitude}`);
    } catch (error) {
        console.error(`❌ Error saving chef ${chef_id} location:`, error);
        throw error;
    }
};

const getChefLocation = async (chef_id) => {
    try {
        const res = await redisClient.get(`chef:location:${chef_id}`);
        if (!res) {
            throw new Error("Location not found");
        }
        return JSON.parse(res);
    } catch (error) {
        console.error(`Error fetching chef location: ${error.message}`);
        return null; // or return a default location object if needed
    }
};



module.exports = {
    acquireLock,
    releaseLock,
    updateChefStatus,
    getChefStatus,
    saveFCMToken,
    getFCMToken,
    updateChefLocation,
    getChefLocation
};