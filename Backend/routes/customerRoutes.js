const express = require('express');
const router = express.Router();
const client = require('../config/db');
const Joi = require('joi');
const {admin} = require('../config/firebase');

router.get('/', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM customer WHERE deleted_at IS NULL');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Error fetching customers' });
    }
})

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('SELECT * FROM customer WHERE customer_id = $1 AND deleted_at IS NULL', [id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        console.error('Error fetching customer by ID:', error);
        res.status(500).json({ message: 'Error fetching customer' });
    }
})

const customerSignUpValidationSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required()
})

router.post('/signup', async(req, res)=>{

const {error, value} = customerSignUpValidationSchema.validate(req.body)

if (error) {
 return res.status(400).json({success:false, message: error.details[0].message });
}

const {email,password,name} = value;

try{
 const userCredential = await admin.auth().createUser({email,password,displayName: name});

 await admin.auth().updateUser(userCredential.uid, {displayName: name})

 // Store details of chef in Postgres
 const insertQuery = `
         INSERT INTO customer (customer_id, full_name, email, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *;
     `;

 const result = await client.query(insertQuery, [
     userCredential.uid,
     name,
     email
 ]);
 
 console.log('[INFO] Customer details saved to Postgres:', result.rows[0]);

 res.status(200).json({success: true, message: userCredential})
}catch (error) {
 console.error('[ERROR] Failed to signup', error);
 res.status(500).json({ success: false, message: error });
}

 

 
})



module.exports = router