const express = require('express');
const router = express.Router();
const client = require('../config/db');
const { saveFCMToken } = require('../services/redisService');


router.get('/', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM chef WHERE deleted_at IS NULL');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching chefs:', error);
        res.status(500).json({ message: 'Error fetching chefs' });
    }
})

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('SELECT * FROM chef WHERE chef_id = $1 AND deleted_at IS NULL', [id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Chef not found' });
        }
    } catch (error) {
        console.error('Error fetching chef by ID:', error);
        res.status(500).json({ message: 'Error fetching chef' });
    }
})

router.post('/update-fcm-token', async(req, res)=>{
    const { chef_id, fcm_token } = req.body;

    if (!chef_id || !fcm_token) {
        return res.status(400).json({ success: false, message: 'chef_id and fcm_token are required' });
    }


    try {
        await saveFCMToken(chef_id, fcm_token);
        res.status(200).json({ success: true, message: 'FCM token updated successfully' });
    } catch (error) {
        console.error('[ERROR] Failed to save FCM token:', error);
        res.status(500).json({ success: false, message: 'Failed to save FCM token' });
    }
})


module.exports = router