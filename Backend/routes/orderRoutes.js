const express = require("express");
const router = express.Router();
const client = require("../config/db");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid"); // For generating unique req_id
const redisService = require("../services/redisService");
const { sendFCMNotification } = require("../services/notificationService");
const redisClient = require("../config/redisCache");

router.get("/", async (req, res) => {
  try {
    const result = await client.query(
      "SELECT * FROM orders WHERE deleted_at IS NULL"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

router.get("/:chef_id", async (req, res) => {
  const { chef_id } = req.params;

  if (!chef_id) {
    return res.status(400).json({ message: "chef_id is required" });
  }

  try {
    const query = `
      SELECT orders.*, recipe.*
      FROM orders
      LEFT JOIN recipe ON orders.recipe_id = recipe.recipe_id
      WHERE orders.chef_id = $1 AND orders.deleted_at IS NULL
    `;

    const result = await client.query(query, [chef_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No orders found for this chef." });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
});




router.get('/instant-order', async (req, res) => {
    const { chef_id } = req.body;

    try {
        // Validate chef_id
        if (!chef_id || typeof chef_id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Chef ID must be a valid string.',
            });
        }

        // Fetch the most recent PENDING INSTANT order for the chef
        const query = "SELECT * FROM orders WHERE chef_id = $1 AND status = 'PENDING' AND type = 'INSTANT' ORDER BY order_date DESC LIMIT 1;";

        const result = await client.query( "SELECT * FROM orders WHERE chef_id = $1 AND status = 'PENDING' AND type = 'INSTANT' ORDER BY order_date DESC LIMIT 1;", [chef_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No pending instant booking request found for this chef.',
            });
        }

        // Return the most recent PENDING INSTANT order
        res.status(200).json({
            success: true,
            message: 'Fetched pending instant booking request successfully.',
            data: result.rows[0],
        });
    } catch (err) {
        console.error('Error fetching instant booking:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch instant booking request. Please try again later.',
        });
    }
});

// router.get("/:id", async (req, res) => {
//     const { id } = req.params;
//     try {
//       const result = await client.query(
//         "SELECT * FROM orders WHERE order_id = $1 AND deleted_at IS NULL",
//         [id]
//       );
//       if (result.rows.length > 0) {
//         res.status(200).json(result.rows[0]);
//       } else {
//         res.status(404).json({ message: "Order not found" });
//       }
//     } catch (error) {
//       console.error("Error fetching order by ID:", error);
//       res.status(500).json({ message: "Error fetching order" });
//     }
//   });

router.get("/instant/current", async (req, res) => {
  const { chef_id } = req.query;  // userId is the chef_id

  if (!chef_id) {
    return res.status(400).json({ message: "chef_id is required" });
  }

  try {
    console.log("🔹 Fetching orders for chef_id:", chef_id);

    // ✅ Step 1: Check if chef_id exists in chef_status and instant_book status is PENDING
    const chefStatusQuery = `
      SELECT order_id 
      FROM chef_status 
      WHERE chef_id = $1 AND instant_book = 'PENDING'
    `;
    const chefStatusResult = await client.query(chefStatusQuery, [chef_id]);

    if (chefStatusResult.rows.length === 0) {
      return res.status(404).json({ message: "No pending instant bookings for this chef." });
    }

    // ✅ Step 2: Get the order_id from chef_status
    const orderId = chefStatusResult.rows[0].order_id;

    // ✅ Step 3: Fetch the corresponding order from orders table with type = 'INSTANT' and status = 'PENDING'
    // AND JOIN with recipes table to get recipe details
    const orderQuery = `
      SELECT o.*, r.*
      FROM orders o
      JOIN recipe r ON o.recipe_id = r.recipe_id
      WHERE o.order_id = $1 AND o.type = 'INSTANT' AND o.status = 'PENDING'
    `;
    const orderResult = await client.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "No matching instant pending orders found." });
    }

    // ✅ Step 4: Return the order details with recipe information
    return res.status(200).json(orderResult.rows);

  } catch (error) {
    console.error("❌ Error fetching order by chef_id:", error);
    res.status(500).json({ message: "Error fetching order" });
  }
});


router.get("/completed-orders/:chef_id", async (req, res) => {
  const { chef_id } = req.params; // Extract chef_id from URL params

  if (!chef_id) {
    return res.status(400).json({ message: "chef_id is required" });
  }

  try {
    const result = await client.query(
      "SELECT * FROM orders WHERE chef_id = $1 AND status IN ('COMPLETED', 'CANCELLED') AND deleted_at IS NULL",
      [chef_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching completed orders:", error);
    res.status(500).json({ message: "Error fetching completed orders" });
  }
});

router.get("/customer-orders/:customer_id", async (req, res) => {
  const { customer_id } = req.params; // Extract customer_id from URL params

  if (!customer_id) {
    return res.status(400).json({ message: "customer_id is required" });
  }

  try {
    // Query to fetch orders along with recipe details
    const result = await client.query(
      `SELECT o.*, r.* 
       FROM orders o
       JOIN recipe r ON o.recipe_id = r.recipe_id
       WHERE o.customer_id = $1 AND o.deleted_at IS NULL`,
      [customer_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No orders found for this customer" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching orders and recipes:", error);
    res.status(500).json({ message: "Error fetching orders and recipes" });
  }
});



//   router.get("/:chef_id/:order_id", async (req, res) => {
//     let { chef_id, order_id } = req.params;

//     try {
//         console.log("🔹 Checking for PENDING orders in chef_status for chef_id:", chef_id);

//         // Step 1: Find the most recent PENDING order for this chef
//         const pendingOrderResult = await client.query(
//             "SELECT order_id FROM chef_status WHERE chef_id = $1 AND instant_book = 'PENDING' ORDER BY order_id DESC LIMIT 1",
//             [chef_id]
//         );

//         console.log("🔹 Pending Orders Found:", pendingOrderResult.rows);

//         if (pendingOrderResult.rows.length > 0) {
//             order_id = pendingOrderResult.rows[0].order_id;
//             console.log("🔹 Using previous PENDING order_id:", order_id);
//         } else {
//             console.log("❌ No PENDING orders found for this chef.");
//             return res.status(404).json({ message: "No PENDING orders found" });
//         }

//         // Step 2: Check the order in orders table
//         console.log("🔹 Checking orders table for order_id:", order_id);
//         const orderResult = await client.query(
//             "SELECT * FROM orders WHERE chef_id = $1 AND order_id = $2 AND deleted_at IS NULL",
//             [chef_id, order_id]
//         );

//         console.log("🔹 Order Query Result:", orderResult.rows);

//         if (orderResult.rows.length === 0) {
//             return res.status(404).json({ message: "Order not found in orders table" });
//         }

//         console.log("✅ Returning Order Data:", orderResult.rows[0]);
//         return res.status(200).json(orderResult.rows[0]);

//     } catch (error) {
//         console.error("❌ Error fetching order:", error);
//         res.status(500).json({ message: "Error fetching order" });
//     }
// });


  


/*
    Create order (Instant Booking) (Only one req can reach the chef)
    - Check in Redis if the chef is READY (READY - Accepting orders, BUSY)
    - Check in Redis if the chef is already locked/reserved (lock with TTL)
    - Acquire the Lock (60s contention period) 
    - If not, then go ahead and start a serializable transaction.
        - Check the chef_status table "instant_book" field, and proceed only if it's AVAILABLE/COMPLETED.
        - Check the chef_sched table (advnc bookings) of the chef. See if its safe for booking, if yes then
          insert a instant_req (with 1min + 30s(buffer) TTL) in the redis, send a notif for chef.
        - User receives SSE based status (Time remaining and status) directly from the redis
        - If chef accepts, insert an order into orders table, change the chef_status table to PENDING along with order_id
          Then update the same in instant_req in redis, (User will be receiving updates on this instant_req via SSE)
        
    Create order (Advanced Booking) (Multiple reqs can reach chef)
    - Check the chef's schedule (advnc bokings) and see if there are conflicting bookings.
    - Two requests (conflicting with each other) can see that there is no conflicting bookings in the sched and send the req to chef.
    - Since it is approval based, chef can see what's conflicting and choose either of them !!!
    - Before approving a booking, it will be again checked against the schedule for conflicts.
    - Once approved, the other conflicting req won't be allowed and optionally show that chef cannot approve those reqs.


    CONFLICT CHECKING LOGIC
    - INSTANT BOOKING:
      - (Chef ETA to User Loc + 
         Recipe Prep Time + 
         Chef ETA to his upcoming Advnc Booking loc + 
         Buffer) + cur_time < Upcoming AdvBooking time ==> Chef can accept.
      - Else WARN the chef that its CONFLICTING and advice to change his status to BUSY so no more reqs are rcvd (or don't allow)
    
    - ADVNCD BOOKING:
      - 


*/

// Create Instant Booking

// Joi validation
const instantBookingSchema = Joi.object({
  chef_id: Joi.string().required(),
  customer_id: Joi.string().required(),
  recipe_id: Joi.number().integer().required(),
  latitude: Joi.number().required(), // 📍 Latitude
  longitude: Joi.number().required(), // 📍 Longitude
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



// router.put("/update-instant-book", async (req, res) => {
//   const { orderId, chef_id } = req.body; // Assuming you're sending the orderId and chef_id in the request body

//   try {
//     // Update the instant_book status to "COMPLETED" in chef_status
//     const chefStatusResult = await client.query(
//       `UPDATE chef_status
//          SET instant_book = $1, updated_at = NOW()
//          WHERE chef_id = $2 AND order_id = $3`,
//       ["COMPLETED", chef_id, orderId]
//     );

//     if (chefStatusResult.rowCount === 0) {
//       console.error(`No matching record in chef_status for chef_id: ${chef_id} and order_id: ${orderId}`);
//       return res.status(404).json({ message: "Record not found for the given chef_id and order_id in chef_status" });
//     }

//     // Update the status and end_date_time to "COMPLETED" in orders table
//     const orderResult = await client.query(
//       `UPDATE orders
//          SET status = $1, end_date_time = NOW()
//          WHERE order_id = $2`,
//       ["COMPLETED", orderId]
//     );

//     if (orderResult.rowCount === 0) {
//       console.error(`No matching record in orders for order_id: ${orderId}`);
//       return res.status(404).json({ message: "Record not found for the given order_id in orders" });
//     }

//     // If both queries are successful, send a success response
//     res.status(200).json({ message: "Order status updated to COMPLETED" });
//   } catch (error) {
//     console.error("Error updating instant book status:", error); // More detailed error log
//     res.status(500).json({ message: "Error updating instant book status", error: error.message });
//   }
// });

router.put("/update-instant-book", async (req, res) => {
  const { orderId, chef_id, status } = req.body; // Include status in the request body

  if (!orderId || !chef_id || !status) {
    return res.status(400).json({ message: "One or more params are missing" });
  }


  // Ensure status is either COMPLETED or CANCELLED
  if (!["COMPLETED", "CANCELLED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status. Allowed values: COMPLETED, CANCELLED" });
  }

  try {
    // Update the instant_book status in chef_status
    const chefStatusResult = await client.query(
      `UPDATE chef_status
         SET instant_book = $1, updated_at = NOW()
         WHERE chef_id = $2 AND order_id = $3`,
      [status, chef_id, orderId]
    );

    if (chefStatusResult.rowCount === 0) {
      console.error(`No matching record in chef_status for chef_id: ${chef_id} and order_id: ${orderId}`);
      return res.status(404).json({ message: "Record not found for the given chef_id and order_id in chef_status" });
    }

    // Update the status and end_date_time in orders table
    const orderResult = await client.query(
      `UPDATE orders
         SET status = $1, end_date_time = NOW()
         WHERE order_id = $2`,
      [status, orderId]
    );

    if (orderResult.rowCount === 0) {
      console.error(`No matching record in orders for order_id: ${orderId}`);
      return res.status(404).json({ message: "Record not found for the given order_id in orders" });
    }

    // If both queries are successful, send a success response
    res.status(200).json({ message: `Order status updated to ${status}` });
  } catch (error) {
    console.error("Error updating instant book status:", error);
    res.status(500).json({ message: "Error updating instant book status", error: error.message });
  }
});


// MAKE A INSTANT ORDER REQUEST
router.post("/instant", async (req, res) => {
  const { error, value } = instantBookingSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  const { chef_id, customer_id, recipe_id, latitude, longitude } = value;

  try {


    // 1️⃣ Check Chef Status in Redis
    const chefStatus = await redisService.getChefStatus(chef_id);
    if (chefStatus !== 'READY') {
        return res.status(400).json({success: false, message: 'Chef is currently busy or unavailable' });
    }

    // 0️⃣ Check if the recipe belongs to the chef and get the recipe title
    const recipeResult = await client.query(
      `SELECT title 
             FROM recipe 
             WHERE recipe_id = $1 AND chef_id = $2 
             LIMIT 1`, // Explicitly limit to 1 for safety
      [recipe_id, chef_id]
    );

    if (recipeResult.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipe or the recipe does not belong to this chef.",
      });
    }

    const recipeTitle = recipeResult.rows[0].title;

    // 1️⃣ Check if there's already an active request for this chef
    const activeRequestKey = `instant_booking:${chef_id}`;
    const existingRequest = await redisClient.get(activeRequestKey);

    if (existingRequest) {
      const data = JSON.parse(existingRequest)

      if(!(data.status == "CANCELLED" || data.status == "REJECTED")){
        return res.status(400).json({
          success: false,
          message:
            "There is already an active instant booking request for this chef.",
        });
      }
    }

      // 2️⃣ Acquire Redis Lock to prevent concurrent requests, contention window
      const lockAcquired = await redisService.acquireLock(
        `chef_lock_${chef_id}`,
        60
      );
      
      if (!lockAcquired) {
        return res.status(400).json({
          success: false,
          message: "Chef is already locked by another request.",
        });
      }

      const fcmToken = await redisService.getFCMToken(chef_id);
      if (!fcmToken) {
        await redisService.releaseLock(`chef_lock_${chef_id}`);
        return res.status(400).json({
          success: false,
          message: "Chef is not registered for notifications.",
        });
      }

          // 3️⃣ Begin Transaction
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // 4️⃣ Check Chef's Instant Booking Status
      const statusResult = await client.query(
          'SELECT instant_book FROM chef_status WHERE chef_id = $1 FOR UPDATE',
          [chef_id]
      );


      if (statusResult.rows[0].instant_book == 'PENDING' && statusResult.rows[0].order_id !== null) {
          await client.query('ROLLBACK');
          await redisService.releaseLock(`chef_lock_${chef_id}`);
          return res.status(400).json({success: false, message: 'Chef is not available for instant booking' });
      }

      await client.query('COMMIT');

    // 3️⃣ Generate a unique req_id and prepare request data
    const req_id = uuidv4();
    const requestData = {
      req_id,
      chef_id,
      customer_id,
      recipe_id,
      recipe_title: recipeTitle,
      latitude: latitude,
      longitude: longitude,
      status: "PENDING", // Initial status
      created_at: Date.now(), // Timestamp
    };

    // 4️⃣ Store the request in Redis with a TTL (e.g., 3 minutes)
    const ttl = 30 + 60;
    await redisClient.setEx(activeRequestKey, ttl, JSON.stringify(requestData)); // TTL: 3 minutes

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

    const notif_id = await sendFCMNotification(
      fcmToken,
      "🍽️ New Instant Booking Request",
      "You have a new booking request.",
      notificationData
    );

    // 6️⃣ Release the lock
    await redisService.releaseLock(`chef_lock_${chef_id}`);

    // 7️⃣ Respond to the client
    res.status(200).json({
      success: true,
      message: "Booking request sent to the chef. Awaiting confirmation.",
      req_id,
    });
  } catch (err) {
    console.error("Error during instant booking:", err);

    try {
        // Rollback DB Transaction
        await client.query('ROLLBACK');
    } catch (rollbackErr) {
        console.error('Error during ROLLBACK:', rollbackErr);
    }

    try {
      await redisService.releaseLock(`chef_lock_${chef_id}`);
    } catch (redisErr) {
      console.error("Error releasing Redis lock:", redisErr);
    }

    res
      .status(500)
      .json({ success: false, message: "Instant booking failed." });
  }
});



router.post("/instant/cancel", async (req, res) => {
  try {
    const { chef_id } = req.body;
    if (!chef_id) {
      return res.status(400).json({
        success: false,
        message: "Chef ID is required.",
      });
    }

    const activeRequestKey = `instant_booking:${chef_id}`;

    // Check if an active request exists
    const existingRequest = await redisClient.get(activeRequestKey);
    if (!existingRequest) {
      return res.status(400).json({
        success: false,
        message: "No active instant booking request found for this chef.",
      });
    }

    // Parse request data
    const requestData = JSON.parse(existingRequest);

    // If already cancelled, prevent redundant cancellation
    if (requestData.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "This booking has already been cancelled.",
      });
    }

    // Update status to CANCELLED
    requestData.status = "CANCELLED";

    // ✅ Get remaining TTL before updating
    let ttl = await redisClient.ttl(activeRequestKey);

    // 🔹 Ensure TTL is valid (Redis returns -1 for NO_EXPIRY and -2 for NON_EXISTENT keys)
    if (ttl === -1) {
      console.warn(`⚠️ Warning: Key ${activeRequestKey} has no expiration set.`);
      ttl = 180; // Default TTL fallback (3 minutes)
    } else if (ttl === -2) {
      return res.status(400).json({
        success: false,
        message: "Booking request expired or does not exist.",
      });
    }

    // ✅ Update Redis with the **same TTL**
    await redisClient.setEx(activeRequestKey, ttl, JSON.stringify(requestData));

    // Send notification to the chef
    const fcmToken = await redisService.getFCMToken(chef_id);
    if (fcmToken) {
      const notificationData = {
        chef_id: String(chef_id),
        customer_id: String(requestData.customer_id),
        recipe_id: String(requestData.recipe_id),
        recipe_title: String(requestData.recipe_title || ""),
        type: "INSTANT_BOOKING_CANCELLED",
      };

      await sendFCMNotification(
        fcmToken,
        "❌ Instant Booking Cancelled",
        "The customer has cancelled the instant booking request.",
        notificationData
      );
    }

    return res.status(200).json({
      success: true,
      message: "Instant booking status updated to CANCELLED, and chef notified.",
    });
  } catch (error) {
    console.error("❌ Error cancelling instant booking:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel the instant booking.",
    });
  }
});





// SSE Endpoint for Instant Booking TTL and Status
router.get("/sse/instant-booking/:chef_id", async (req, res) => {
  const { chef_id } = req.params;

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Function to send SSE data
  const sendEvent = async () => {
    try {
      const reqData = await redisClient.get(`instant_booking:${chef_id}`);
      const parsedData = await JSON.parse(reqData);
      const ttl = await redisClient.ttl(`instant_booking:${chef_id}`);
      if (ttl > 0) {
        res.write(
          `data: ${JSON.stringify({
            ttl: ttl > 30 ? ttl - 30 : 0,
            trueTtl: ttl,
            expired: ttl <= 30,
            status: parsedData?.status,
          })}\n\n`
        );
      } else {
        res.write(
          `data: ${JSON.stringify({
            ttl: 0,
            trueTtl: ttl,
            expired: true,
            status: parsedData.status,
          })}\n\n`
        );
      }
    } catch (err) {
      console.error("Error fetching TTL:", err);
      res.write(
        `event: error\ndata: ${JSON.stringify({
          error: "Error fetching TTL",
        })}\n\n`
      );
      res.end();
      clearInterval(interval); // Stop sending updates when expired
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
  chef_id: Joi.string().required(),
  customer_id: Joi.string().required(),
  recipe_id: Joi.number().integer().required(),
  response: Joi.string().valid("ACCEPT", "REJECT").required(),
  chef_latitude: Joi.number().required(),  // Added latitude validation
  chef_longitude: Joi.number().required(), // Added longitude validation
});

// router.post('/instant/respond', async (req, res) => {
//     const { error, value } = responseSchema.validate(req.body);
//     if (error) {
//         return res.status(400).json({success: false, message: error.details[0].message });
//     }

//     const { chef_id, customer_id, recipe_id, response } = value;

//     try {
//         // 1️⃣ Check if there's a pending booking
//         const statusResult = await client.query(
//             'SELECT instant_book FROM chef_status WHERE chef_id = $1',
//             [chef_id]
//         );

//         if (statusResult.rows[0].instant_book !== 'PENDING') {
//             return res.status(400).json({success: false, message: 'No pending booking found for this chef.' });
//         }

//         // 2️⃣ Handle ACCEPT response
//         if (response === 'ACCEPT') {
//             // Start DB Transaction
//             await client.query('BEGIN');

//             // Insert the order
//             await client.query(
//                 `INSERT INTO orders (customer_id, chef_id, recipe_id, total_price, status, created_at)
//                  VALUES ($1, $2, $3, $4, $5, NOW())`,
//                 [customer_id, chef_id, recipe_id, 1000, 'PENDING']  // Assuming fixed price
//             );

//             // Update chef's instant booking status to BOOKED
//             await client.query(
//                 'UPDATE chef_status SET instant_book = $1 WHERE chef_id = $2',
//                 ['BOOKED', chef_id]
//             );

//             // Commit the transaction
//             await client.query('COMMIT');

//             // Update Redis: Chef is now BUSY
//             await redisClient.set(`chef_status_${chef_id}`, 'BUSY');

//             return res.status(200).json({ message: 'Order created successfully. Chef is now busy.' });

//         } else {
//             // 3️⃣ Handle REJECT response
//             await client.query(
//                 'UPDATE chef_status SET instant_book = $1 WHERE chef_id = $2',
//                 ['AVAILABLE', chef_id]
//             );

//             // Release Redis Lock if exists
//             await redisClient.del(`chef_lock_${chef_id}`);

//             return res.status(200).json({ message: 'Chef has rejected the booking. Status reset.' });
//         }

//     } catch (err) {
//         // Rollback if any error occurs
//         await client.query('ROLLBACK');
//         console.error('Error processing response:', err);
//         res.status(500).json({ message: 'Failed to process chef response.' });
//     }
// });

router.post("/instant/response", async (req, res) => {
  const { error, value } = responseSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  const { chef_id, customer_id, recipe_id, response, chef_latitude, chef_longitude } = value;
  const activeRequestKey = `instant_booking:${chef_id}`;

  try {
    // Extend the time

    // 1️⃣ Check Redis for the active booking request
    const requestDataJSON = await redisClient.get(activeRequestKey);

    if (!requestDataJSON) {
      return res.status(400).json({
        success: false,
        message: "No active instant booking request for this chef.",
      });
    }

    const requestData = JSON.parse(requestDataJSON);

    // 2️⃣ Check `chef_status` table for the chef's current status
    // const statusResult = await client.query(
    //     'SELECT instant_book FROM chef_status WHERE chef_id = $1',
    //     [chef_id]
    // );

    // if (statusResult.rows[0].instant_book !== 'PENDING') {
    //                 return res.status(400).json({success: false, message: 'No pending booking found for this chef.' });
    //             }

    // 3️⃣ Handle response: ACCEPT or REJECT
    if (response === "ACCEPT") {
      

      const reqData = await redisClient.get(activeRequestKey);
      const reqDataJson = await JSON.parse(reqData)

      await client.query("BEGIN"); // Start transaction
      let orderId;

      try {
        console.log("Inserting order into database...");
        //   const result = await client.query(
        //     `INSERT INTO orders (customer_id, chef_id, recipe_id, total_price, status, type, start_date_time, end_date_time)
        //  VALUES ($1, $2, $3, $4, $5, 'INSTANT', NOW(), NOW())`,
        //     [customer_id, chef_id, recipe_id, 1000, "PENDING"]
        //   );
        const orderResult = await client.query(
          `INSERT INTO orders (customer_id, chef_id, recipe_id, total_price, status, type, start_date_time, end_date_time, latitude, longitude, chef_latitude, chef_longitude)
         VALUES ($1, $2, $3, $4, $5, 'INSTANT', NOW(), NOW(), $6, $7, $8, $9)
         RETURNING order_id`,
          [customer_id, chef_id, recipe_id, 1000, "PENDING", reqDataJson.latitude, reqDataJson.longitude, chef_latitude, chef_longitude]
        );

        // Ensure result contains the order_id
        if (orderResult.rows.length === 0) {
          throw new Error("Failed to insert order and retrieve order_id.");
        }
        orderId = orderResult.rows[0].order_id;
        console.log("Inserted order with ID:", orderId);

        // Extract the newly generated order_id

        // Update `chef_status` to `PENDING`
        // await client.query(
        //   `UPDATE chef_status
        //      SET instant_book = $1, order_id = $2, updated_at = NOW()
        //      WHERE chef_id = $3`,
        //   ["PENDING", orderId, chef_id]
        // );

        const result = await client.query(
          `SELECT 1 FROM chef_status WHERE chef_id = $1`,
          [chef_id]
        );
        
        if (result.rowCount > 0) {
          // Update existing record
          await client.query(
            `UPDATE chef_status
               SET instant_book = $1, order_id = $2, updated_at = NOW()
               WHERE chef_id = $3`,
            ["PENDING", orderId, chef_id]
          );
        } else {
          // Insert new record
          await client.query(
            `INSERT INTO chef_status (chef_id, instant_book, order_id, updated_at)
             VALUES ($1, $2, $3, NOW())`,
            [chef_id, "PENDING", orderId]
          );
        }

        await client.query("COMMIT"); // Commit the transaction

        requestData.status = "ACCEPTED";
        // Extend TTL in Redis
        const extendedTTL = 200; // Extend by 200 seconds
        await redisClient.expire(activeRequestKey, extendedTTL);
        await redisClient.setEx(
          activeRequestKey,
          30,
          JSON.stringify(requestData)
        );
        
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
      // Send notification to the customer
      // const userNotificationData = {
      //     chef_id,
      //     customer_id,
      //     recipe_id,
      //     recipe_title: requestData.recipe_title,
      //     type: 'INSTANT_BOOKING_ACCEPTED',
      // };

      const userNotificationData = {
        chef_id: String(chef_id),
        customer_id: String(customer_id),
        recipe_id: String(recipe_id),
        recipe_title: String(requestData.recipe_title || ""),
        type: "INSTANT_BOOKING_ACCEPTED",
        chef_latitude: chef_latitude,  
        chef_longitude: chef_longitude 
      };

      const fcmToken = await redisService.getFCMToken(customer_id);
      if (!fcmToken) {
        return res.status(400).json({
          success: false,
          message: "Customer is not registered for notifications.",
        });
      }

      await sendFCMNotification(
        fcmToken,
        "🎉 Your Instant Booking is Accepted!",
        "The chef has accepted your instant booking request.",
        userNotificationData
      );

      return res.status(200).json({
        success: true,
        message:
          "Order accepted, status updated, TTL extended, stored in DB, and notification sent to the customer.",
          orderId,
      });
    } else if (response === "REJECT") {
      requestData.status = "REJECTED";
      // Extend TTL in Redis
      const extendedTTL = 200; // Extend by 200 seconds
      await redisClient.expire(activeRequestKey, extendedTTL);
      await redisClient.setEx(
        activeRequestKey,
        30,
        JSON.stringify(requestData)
      );

      // Update `chef_status` to `AVAILABLE`
      // await client.query(
      //   "UPDATE chef_status SET instant_book = $1, updated_at = NOW() WHERE chef_id = $2",
      //   ["AVAILABLE", chef_id]
      // );

   
      // Send notification to the customer
      const userNotificationData = {
        chef_id: String(chef_id),
        customer_id: String(customer_id),
        recipe_id: String(recipe_id),
        recipe_title: String(requestData.recipe_title || ""),
        type: "INSTANT_BOOKING_REJECTED",
        chef_latitude: chef_latitude,  
        chef_longitude: chef_longitude 
      };

      const fcmToken = await redisService.getFCMToken(customer_id);
      if (!fcmToken) {
        return res.status(400).json({
          success: false,
          message: "Customer is not registered for notifications.",
        });
      }

      await sendFCMNotification(
        fcmToken,
        "😞 Your Instant Booking is Rejected",
        "The chef has rejected your instant booking request.",
        userNotificationData
      );
      

      return res.status(200).json({
        success: true,
        message:
          "Order rejected, status updated, and notification sent to the customer.",
      });
    }else{
        return res
        .status(400)
        .json({ success: false, message: "Invalid response value." });
    }

   
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback transaction in case of error
    console.error("Error processing instant booking response:", err);

    return res.status(500).json({
      success: false,
      message: "Error processing instant booking response. Please try again.",
    });
  }
});

// router.post('/instant/response', async (req, res) => {
//     const { error, value } = responseSchema.validate(req.body);
//     if (error) {
//         return res.status(400).json({ success: false, message: error.details[0].message });
//     }

//     const { chef_id, customer_id, recipe_id, response } = value;
//     const activeRequestKey = `instant_booking:${chef_id}`;

//     try {
//         // Check Redis for the active booking request
//         const requestDataJSON = await redisClient.get(activeRequestKey);
//         if (!requestDataJSON) {
//             return res.status(400).json({ success: false, message: 'No active instant booking request for this chef.' });
//         }

//         const requestData = JSON.parse(requestDataJSON);

//         // Handle ACCEPT or REJECT
//         if (response === 'ACCEPT' || response === 'REJECT') {
//             const newStatus = response === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
//             requestData.status = newStatus;

//             // Update Redis with updated status
//             const extendedTTL = 200; // Extend by 200 seconds
//             await redisClient.expire(activeRequestKey, extendedTTL);
//             await redisClient.setEx(activeRequestKey, 30, JSON.stringify(requestData));

//             // Update `chef_status`
//             const chefStatus = response === 'ACCEPT' ? 'BOOKED' : 'AVAILABLE';
//             await client.query(
//                 'UPDATE chef_status SET instant_book = $1, updated_at = NOW() WHERE chef_id = $2',
//                 [chefStatus, chef_id]
//             );

//             if (response === 'ACCEPT') {
//                 // Insert order into DB
//                 await client.query(
//                     `INSERT INTO orders (customer_id, chef_id, recipe_id, total_price, status, type, start_date_time, end_date_time)
//                      VALUES ($1, $2, $3, $4, $5, 'INSTANT', NOW(), NOW())`,
//                     [customer_id, chef_id, recipe_id, 1000, 'PENDING']
//                 );
//             }

//             // Send notification to the customer
//             const notificationType =
//                 response === 'ACCEPT' ? 'INSTANT_BOOKING_ACCEPTED' : 'INSTANT_BOOKING_REJECTED';

//             const notificationTitle =
//                 response === 'ACCEPT'
//                     ? '🎉 Your Instant Booking is Accepted!'
//                     : '😞 Your Instant Booking is Rejected';

//             const notificationBody =
//                 response === 'ACCEPT'
//                     ? 'The chef has accepted your instant booking request.'
//                     : 'The chef has rejected your instant booking request.';

//             const userNotificationData = {
//                 chef_id: String(chef_id),
//                 customer_id: String(customer_id),
//                 recipe_id: String(recipe_id),
//                 recipe_title: String(requestData.recipe_title || ''),
//                 type: notificationType,
//             };

//             const fcmToken = await redisService.getFCMToken(customer_id);
//             if (fcmToken) {
//                 await sendFCMNotification(fcmToken, notificationTitle, notificationBody, userNotificationData);
//             }

//             return res.status(200).json({
//                 success: true,
//                 message: response === 'ACCEPT'
//                     ? 'Order accepted and notification sent.'
//                     : 'Order rejected and notification sent.',
//             });
//         }

//         return res.status(400).json({ success: false, message: 'Invalid response value.' });
//     } catch (err) {
//         await client.query('ROLLBACK'); // Rollback transaction in case of error
//         console.error('Error processing instant booking response:', err);
//         return res.status(500).json({
//             success: false,
//             message: 'Error processing instant booking response. Please try again.',
//         });
//     }
// });


module.exports = router;
