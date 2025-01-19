const express = require('express');
const router = express.Router();
const client = require('../config/db'); 
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid'); // For generating unique req_id
const redisService = require('../services/redisService');
const { sendFCMNotification } = require('../services/notificationService');
const redisClient = require('../config/redisCache');


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

// router.post('/instant', async (req, res) => {
//     const { error, value } = instantBookingSchema.validate(req.body);
//     if (error) {
//         return res.status(400).json({success:false, message: error.details[0].message });
//     }

//     const { chef_id, customer_id, recipe_id, latitude, longitude } = value;

//     try {

//         // 0️⃣ Check if the recipe belongs to the chef and get the recipe title
//         const recipeResult = await client.query(
//             `SELECT title 
//              FROM recipe 
//              WHERE recipe_id = $1 AND chef_id = $2 
//              LIMIT 1`,  // Explicitly limit to 1 for safety
//             [recipe_id, chef_id]
//         );
        
//         if (recipeResult.rowCount === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid recipe or the recipe does not belong to this chef.'
//             });
//         }
        
//         const recipeTitle = recipeResult.rows[0].title;



//         // 1️⃣ Check Chef Status in Redis
//         const chefStatus = await redisService.getChefStatus(chef_id);
//         if (chefStatus !== 'READY') {
//             return res.status(400).json({success: false, message: 'Chef is currently busy or unavailable' });
//         }

//         // 2️⃣ Acquire Redis Lock
//         const lockAcquired = await redisService.acquireLock(`chef_lock_${chef_id}`, 60);
//         if (!lockAcquired) {
//             return res.status(400).json({success: false, message: 'Chef is already locked by another request' });
//         }

//         const fcmToken = await redisService.getFCMToken(chef_id);
//         if (!fcmToken) {
//             await releaseLock(`chef_lock_${chef_id}`);
//             return res.status(400).json({ success: false, message: 'Chef is not registered for notifications' });
//         }

//         // 3️⃣ Begin Transaction
//         await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

//         // 4️⃣ Check Chef's Instant Booking Status
//         const statusResult = await client.query(
//             'SELECT instant_book FROM chef_status WHERE chef_id = $1 FOR UPDATE',
//             [chef_id]
//         );


        
//         //TODO: If status is BOOKED, send error. 
//         // If status is PENDING, check NOW() - updated_at > 2mins, if so allow.
        

//         if (statusResult.rows[0].instant_book !== 'AVAILABLE') {
//             await client.query('ROLLBACK');
//             await redisService.releaseLock(`chef_lock_${chef_id}`);
//             return res.status(400).json({success: false, message: 'Chef is not available for instant booking' });
//         }

//         //TODO: Check if this instant booking collides with chef's advance booking schedule.

//         // 5️⃣ Update Chef Status to PENDING
//         await client.query(
//             'UPDATE chef_status SET instant_book = $1 WHERE chef_id = $2',
//             ['PENDING', chef_id]
//         );



//         // 6️⃣ Commit the transaction
//         await client.query('COMMIT');

//         const notificationData = {
//             chef_id: chef_id.toString(),
//             customer_id: customer_id.toString(),
//             recipe_id: recipe_id.toString(),
//             recipe_title: recipeTitle.toString(),
//             latitude: latitude.toString(),
//             longitude: longitude.toString(),
//             type: "INSTANT_BOOKING"
//         };
        
//         const notif_id = await sendFCMNotification(fcmToken, '🍽️ New Instant Booking Request', 'You have a new booking request.', notificationData);

//         //TODO: Put the notif_id in Redis along with the notificationData

//         // 7️⃣ Send Notification to Chef (Simulated)
//         console.log(`🔔 Notification sent to Chef ID ${chef_id} for instant booking approval.`);

//         res.status(200).json({
//             success: true,
//             message: 'Booking request sent to the chef. Awaiting confirmation.'
//         });
//     } catch (err) {
//         console.error('Error during instant booking:', err);
//         try {
//             // Rollback DB Transaction
//             await client.query('ROLLBACK');
//         } catch (rollbackErr) {
//             console.error('Error during ROLLBACK:', rollbackErr);
//         }
        
//         try {
//             // Release Redis Lock
//             await redisService.releaseLock(`chef_lock_${chef_id}`);
//         } catch (redisErr) {
//             console.error('Error releasing Redis lock:', redisErr);
//         }
//         res.status(500).json({success: false, message: 'Instant booking failed' });
    
//     }
// });

// Respond to instant booking request




router.post('/instant', async (req, res) => {
    const { error, value } = instantBookingSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { chef_id, customer_id, recipe_id, latitude, longitude } = value;

    try {
        // 0️⃣ Check if the recipe belongs to the chef and get the recipe title
        const recipeResult = await client.query(
            `SELECT title 
             FROM recipe 
             WHERE recipe_id = $1 AND chef_id = $2 
             LIMIT 1`,  // Explicitly limit to 1 for safety
            [recipe_id, chef_id]
        );

        if (recipeResult.rowCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid recipe or the recipe does not belong to this chef.'
            });
        }

        const recipeTitle = recipeResult.rows[0].title;

        // 1️⃣ Check if there's already an active request for this chef
        const activeRequestKey = `instant_booking:${chef_id}`;
        const existingRequest = await redisClient.get(activeRequestKey);

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'There is already an active instant booking request for this chef.'
            });
        }

        // 2️⃣ Acquire Redis Lock to prevent concurrent requests
        const lockAcquired = await redisService.acquireLock(`chef_lock_${chef_id}`, 60);
        if (!lockAcquired) {
            return res.status(400).json({ success: false, message: 'Chef is already locked by another request.' });
        }

        const fcmToken = await redisService.getFCMToken(chef_id);
        if (!fcmToken) {
            await redisService.releaseLock(`chef_lock_${chef_id}`);
            return res.status(400).json({ success: false, message: 'Chef is not registered for notifications.' });
        }

        // 3️⃣ Generate a unique req_id and prepare request data
        const req_id = uuidv4();
        const requestData = {
            req_id,
            chef_id,
            customer_id,
            recipe_id,
            recipe_title: recipeTitle,
            latitue: latitude,
            longitude: longitude,
            status: 'PENDING', // Initial status
            created_at: Date.now() // Timestamp
        };

        // 4️⃣ Store the request in Redis with a TTL (e.g., 3 minutes)
        await redisClient.setEx(activeRequestKey, 180 ,JSON.stringify(requestData)); // TTL: 3 minutes
            
        // 5️⃣ Send Notification with req_id attached
        const notificationData = {
            req_id: req_id.toString(),
            chef_id: chef_id.toString(),
            customer_id: customer_id.toString(),
            recipe_id: recipe_id.toString(),
            recipe_title: recipeTitle.toString(),
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            type: "INSTANT_BOOKING", // Already a string
        };

        const notif_id = await sendFCMNotification(fcmToken, '🍽️ New Instant Booking Request', 'You have a new booking request.', notificationData);

        // 6️⃣ Release the lock
        await redisService.releaseLock(`chef_lock_${chef_id}`);

        // 7️⃣ Respond to the client
        res.status(200).json({
            success: true,
            message: 'Booking request sent to the chef. Awaiting confirmation.',
            req_id,
        });
    } catch (err) {
        console.error('Error during instant booking:', err);

        try {
            await redisService.releaseLock(`chef_lock_${chef_id}`);
        } catch (redisErr) {
            console.error('Error releasing Redis lock:', redisErr);
        }

        res.status(500).json({ success: false, message: 'Instant booking failed.' });
    }
});

// SSE Endpoint for Instant Booking TTL
router.get("/sse/instant-booking/:chef_id", async (req, res) => {
    const { chef_id } = req.params;

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Function to send SSE data
    const sendEvent = async () => {
        try {
            const ttl = await redisClient.ttl(`instant_booking:${chef_id}`);
            if (ttl > 0) {
                res.write(`data: ${JSON.stringify({ ttl, expired: false })}\n\n`);
            } else {
                res.write(`data: ${JSON.stringify({ ttl: 0, expired: true })}\n\n`);
                clearInterval(interval); // Stop sending updates when expired
                res.end(); // Close the connection
            }
        } catch (err) {
            console.error("Error fetching TTL:", err);
            res.write(`event: error\ndata: ${JSON.stringify({ error: "Error fetching TTL" })}\n\n`);
            res.end();
        }
    };

    // Send initial TTL and continue every second
    sendEvent();
    const interval = setInterval(sendEvent, 1000);

    // Cleanup on client disconnect
    req.on("close", () => {
        clearInterval(interval);
        res.end();
    });
});


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

