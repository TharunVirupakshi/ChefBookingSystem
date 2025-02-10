const express = require('express');
const router = express.Router();
const client = require('../config/db');
const { saveFCMToken, getChefStatus } = require('../services/redisService');
const {admin} = require('../config/firebase');
const Joi = require('joi');
const { updateChefStatus } = require('../services/redisService')


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

router.get('/status/:chef_id', async(req, res)=>{
        const { chef_id } = req.params

        if(!chef_id){
            return res.status(400).json({ success: false, message: 'chef_id is required' }); 
        }

        try {
            const status = await getChefStatus(chef_id);
            // console.log(status)
            return res.status(200).json({success: true, status});
        } catch (error) {
            console.log("Error fetching Chef Status");
            return res.status(500).json({
                success: false,
                message: 'Failed to get chef status'
            }); 
        }
})

router.put('/status', async(req, res) => {
    const { chef_id, status } = req.body;

    if(!chef_id || !status){
        return res.status(400).json({ success: false, message: 'chef_id and status are required' }); 
    }

    const validStatuses = ['READY', 'BUSY'];
    if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({ success: false, message: 'Invalid status. Allowed values are READY or BUSY' });
    }


    try {
        // 3️⃣ Update the chef's status in Redis
        
        await updateChefStatus(chef_id, status.toUpperCase());

        console.log(`🔄 Chef ID ${chef_id} status updated to ${status.toUpperCase()}`);

        // 4️⃣ Respond with success
        return res.status(200).json({
            success: true,
            message: `Chef status updated to ${status.toUpperCase()}`
        });

    } catch (error) {
        console.error('❌ Error updating chef status:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update chef status'
        });
    }


})


const chefSignUpValidationSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required()
})

router.post('/signup', async(req, res)=>{

   const {error, value} = chefSignUpValidationSchema.validate(req.body)

   if (error) {
    return res.status(400).json({success:false, message: error.details[0].message });
   }

   const {email,password,name} = value;
  
   try{
    const userCredential = await admin.auth().createUser({email,password,displayName: name});

    await admin.auth().updateUser(userCredential.uid, {displayName: name})
    await admin.auth().setCustomUserClaims(userCredential.uid, {chef:true})
    

    // Store details of chef in Postgres
    const insertQuery = `
            INSERT INTO chef (chef_id, full_name, email, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING *;
        `;

    const result = await client.query(insertQuery, [
        userCredential.uid,
        name,
        email
    ]);
    
    console.log('[INFO] Chef details saved to Postgres:', result.rows[0]);

    res.status(200).json({success: true, messaging: userCredential})
   }catch (error) {
    console.error('[ERROR] Failed to signup', error);
    res.status(500).json({ success: false, message: error });
}    
})

module.exports = router