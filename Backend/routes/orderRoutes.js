const express = require('express');
const router = express.Router();
const client = require('../config/db'); 
const Joi = require('joi');

const redisService = require('../services/redisService');
const { sendFCMNotification } = require('../services/notificationService');


router.get('/', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM orders WHERE deleted_at IS NULL');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('SELECT * FROM orders WHERE order_id = $1 AND deleted_at IS NULL', [id]);
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        res.status(500).json({ message: 'Error fetching order' });
    }
});


/*
    Create order (Instant Booking) (Only one req can reach the chef)
    - Check in Redis if the chef is READY (READY - Accepting orders, BUSY)
    - Check in Redis if the chef is already locked/reserved (lock with TTL) 
    - If not, then go ahead and start a serializable transaction.
        - Check the chef_status table "instant_book" field, and proceed only if it's AVAILABLE.
        - Put a lock in the Redis. 
        - Check the chef_sched table (advnc bookings) of the chef. See if its safe for booking, if yes
          mark the chef_status table "instant_book" field as PENDING (as it is required approval from chef)
          and send a req to chef (Notification).
        - If chef accepts, mark the chef's "instant_book" field as BOOKED.
          Automatically update chef's status in redis to BUSY.
        
    Create order (Advanced Booking) (Multiple reqs can reach chef)
    - Check the chef's schedule (advnc bokings) and see if there are conflicting bookings.
    - Two requests (conflicting with each other) can see that there is no conflicting bookings in the sched and send the req to chef.
    - Since it is approval based, chef can see what's conflicting and choose either of them.
    - Before approving a booking, it will be again checked against the schedule for conflicts.
    - Once approved, the other conflicting req won't be allowed and optionally show that chef cannot approve those reqs.



*/


// Create Instant Booking

// Joi validation
const instantBookingSchema = Joi.object({
    chef_id: Joi.string().required(),
    customer_id: Joi.string().required(),
    recipe_id: Joi.number().integer().required(),
    latitude: Joi.number().required(),  // 📍 Latitude
    longitude: Joi.number().required()  // 📍 Longitude
});

router.post('/instant', async (req, res) => {
    const { error, value } = instantBookingSchema.validate(req.body);
    if (error) {
        return res.status(400).json({success:false, message: error.details[0].message });
    }

    const { chef_id, customer_id, recipe_id, latitude, longitude } = value;

    try {

        //TODO: Check if recipe is posted by the correct chef


        // 1️⃣ Check Chef Status in Redis
        const chefStatus = await redisService.getChefStatus(chef_id);
        if (chefStatus !== 'READY') {
            return res.status(400).json({success: false, message: 'Chef is currently busy or unavailable' });
        }

        // 2️⃣ Acquire Redis Lock
        const lockAcquired = await redisService.acquireLock(`chef_lock_${chef_id}`, 60);
        if (!lockAcquired) {
            return res.status(400).json({success: false, message: 'Chef is already locked by another request' });
        }

        const fcmToken = await redisService.getFCMToken(chef_id);
        if (!fcmToken) {
            await releaseLock(`chef_lock_${chef_id}`);
            return res.status(400).json({ success: false, message: 'Chef is not registered for notifications' });
        }

        // 3️⃣ Begin Transaction
        await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

        // 4️⃣ Check Chef's Instant Booking Status
        const statusResult = await client.query(
            'SELECT instant_book FROM chef_status WHERE chef_id = $1 FOR UPDATE',
            [chef_id]
        );

        if (statusResult.rows[0].instant_book !== 'AVAILABLE') {
            await client.query('ROLLBACK');
            await redisService.releaseLock(`chef_lock_${chef_id}`);
            return res.status(400).json({success: false, message: 'Chef is not available for instant booking' });
        }

        //TODO: Check if this instant booking collides with chef's advance booking schedule.

        // 5️⃣ Update Chef Status to PENDING
        await client.query(
            'UPDATE chef_status SET instant_book = $1 WHERE chef_id = $2',
            ['PENDING', chef_id]
        );

        // 6️⃣ Commit the transaction
        await client.query('COMMIT');

        const notificationData = {
            chef_id: chef_id.toString(),
            customer_id: customer_id.toString(),
            recipe_id: recipe_id.toString(),
            latitude: latitude.toString(),
            longitude: longitude.toString()
        };
        
        await sendFCMNotification(fcmToken, '🍽️ New Instant Booking Request', 'You have a new booking request.', notificationData);

        // 7️⃣ Send Notification to Chef (Simulated)
        console.log(`🔔 Notification sent to Chef ID ${chef_id} for instant booking approval.`);

        res.status(200).json({
            success: true,
            message: 'Booking request sent to the chef. Awaiting confirmation.'
        });
    } catch (err) {
        console.error('Error during instant booking:', err);
        try {
            // Rollback DB Transaction
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Error during ROLLBACK:', rollbackErr);
        }
        
        try {
            // Release Redis Lock
            await redisService.releaseLock(`chef_lock_${chef_id}`);
        } catch (redisErr) {
            console.error('Error releasing Redis lock:', redisErr);
        }
        res.status(500).json({success: false, message: 'Instant booking failed' });
    
    }
});

// Respond to instant booking request

const responseSchema = Joi.object({
    chef_id: Joi.number().integer().required(),
    customer_id: Joi.number().integer().required(),
    recipe_id: Joi.number().integer().required(),
    response: Joi.string().valid('ACCEPT', 'REJECT').required()
});

router.post('/instant/respond', async (req, res) => {
    const { error, value } = responseSchema.validate(req.body);
    if (error) {
        return res.status(400).json({success: false, message: error.details[0].message });
    }

    const { chef_id, customer_id, recipe_id, response } = value;

    try {
        // 1️⃣ Check if there's a pending booking
        const statusResult = await client.query(
            'SELECT instant_book FROM chef_status WHERE chef_id = $1',
            [chef_id]
        );

        if (statusResult.rows[0].instant_book !== 'PENDING') {
            return res.status(400).json({success: false, message: 'No pending booking found for this chef.' });
        }

        // 2️⃣ Handle ACCEPT response
        if (response === 'ACCEPT') {
            // Start DB Transaction
            await client.query('BEGIN');

            // Insert the order
            await client.query(
                `INSERT INTO orders (customer_id, chef_id, recipe_id, total_price, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [customer_id, chef_id, recipe_id, 1000, 'PENDING']  // Assuming fixed price
            );

            // Update chef's instant booking status to BOOKED
            await client.query(
                'UPDATE chef_status SET instant_book = $1 WHERE chef_id = $2',
                ['BOOKED', chef_id]
            );

            // Commit the transaction
            await client.query('COMMIT');

            // Update Redis: Chef is now BUSY
            await redisClient.set(`chef_status_${chef_id}`, 'BUSY');

            return res.status(200).json({ message: 'Order created successfully. Chef is now busy.' });

        } else {
            // 3️⃣ Handle REJECT response
            await client.query(
                'UPDATE chef_status SET instant_book = $1 WHERE chef_id = $2',
                ['AVAILABLE', chef_id]
            );

            // Release Redis Lock if exists
            await redisClient.del(`chef_lock_${chef_id}`);

            return res.status(200).json({ message: 'Chef has rejected the booking. Status reset.' });
        }

    } catch (err) {
        // Rollback if any error occurs
        await client.query('ROLLBACK');
        console.error('Error processing response:', err);
        res.status(500).json({ message: 'Failed to process chef response.' });
    }
});


module.exports = router

