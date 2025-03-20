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

// Endpoint to fetch blocked dates (time slots) for a chef on a given date
router.get("/blocked-dates", async (req, res) => {
  const { chef_id, date } = req.query;

  if (!chef_id || !date) {
    return res.status(400).json({
      success: false,
      message:
        "chef_id and date are required. (date should be in YYYY-MM-DD format)",
    });
  }

  try {
    // Query orders for the chef on the given day using DATE() function in PostgreSQL.
    const result = await client.query(
      `SELECT order_id, type, start_date_time, end_date_time 
       FROM orders 
       WHERE chef_id = $1 
         AND DATE(start_date_time) = DATE($2)
         AND (( type = 'INSTANT' AND status = 'PENDING') OR (type = 'ADVANCE' AND status = 'CONFIRMED'))
       ORDER BY start_date_time ASC`,
      [chef_id, date]
    );

    console.log(result.rows);
    return res.status(200).json({
      success: true,
      blockedDates: result.rows,
    });
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
      return res
        .status(404)
        .json({ message: "No orders found for this chef." });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

router.get("/instant-order", async (req, res) => {
  const { chef_id } = req.body;

  try {
    // Validate chef_id
    if (!chef_id || typeof chef_id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Chef ID must be a valid string.",
      });
    }

    // Fetch the most recent PENDING INSTANT order for the chef
    const query =
      "SELECT * FROM orders WHERE chef_id = $1 AND status = 'PENDING' AND type = 'INSTANT' ORDER BY order_date DESC LIMIT 1;";

    const result = await client.query(
      "SELECT * FROM orders WHERE chef_id = $1 AND status = 'PENDING' AND type = 'INSTANT' ORDER BY order_date DESC LIMIT 1;",
      [chef_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No pending instant booking request found for this chef.",
      });
    }

    // Return the most recent PENDING INSTANT order
    res.status(200).json({
      success: true,
      message: "Fetched pending instant booking request successfully.",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Error fetching instant booking:", err);
    res.status(500).json({
      success: false,
      message:
        "Failed to fetch instant booking request. Please try again later.",
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
  const { chef_id } = req.query; // userId is the chef_id

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
      return res
        .status(404)
        .json({ message: "No pending instant bookings for this chef." });
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
      return res
        .status(404)
        .json({ message: "No matching instant pending orders found." });
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
      `SELECT o.*, r.*, c.full_name as chef_name
       FROM orders o
       JOIN recipe r ON o.recipe_id = r.recipe_id
       JOIN chef c ON o.chef_id = c.chef_id
       WHERE o.customer_id = $1 
       AND o.deleted_at IS NULL`,
      [customer_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for this customer" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching orders and recipes:", error);
    res.status(500).json({ message: "Error fetching orders and recipes" });
  }
});

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

router.put("/update-instant-book", async (req, res) => {
  const { orderId, chef_id, status } = req.body; // Include status in the request body

  if (!orderId || !chef_id || !status) {
    return res.status(400).json({ message: "One or more params are missing" });
  }

  // Ensure status is either COMPLETED or CANCELLED
  if (!["COMPLETED", "CANCELLED"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status. Allowed values: COMPLETED, CANCELLED",
    });
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
      console.error(
        `No matching record in chef_status for chef_id: ${chef_id} and order_id: ${orderId}`
      );
      return res.status(404).json({
        message:
          "Record not found for the given chef_id and order_id in chef_status",
      });
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
      return res
        .status(404)
        .json({ message: "Record not found for the given order_id in orders" });
    }

    // If both queries are successful, send a success response
    res.status(200).json({ message: `Order status updated to ${status}` });
  } catch (error) {
    console.error("Error updating instant book status:", error);
    res.status(500).json({
      message: "Error updating instant book status",
      error: error.message,
    });
  }
});

// Create Instant Booking

// Joi validation
const instantBookingSchema = Joi.object({
  chef_id: Joi.string().required(),
  customer_id: Joi.string().required(),
  recipe_id: Joi.number().integer().required(),
  latitude: Joi.number().required(), // 📍 Latitude
  longitude: Joi.number().required(), // 📍 Longitude
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
    if (chefStatus !== "READY") {
      return res.status(400).json({
        success: false,
        message: "Chef is currently busy or unavailable",
      });
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
      const data = JSON.parse(existingRequest);

      if (!(data.status == "CANCELLED" || data.status == "REJECTED")) {
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
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");

    // 4️⃣ Check Chef's Instant Booking Status
    const statusResult = await client.query(
      "SELECT instant_book FROM chef_status WHERE chef_id = $1 FOR UPDATE",
      [chef_id]
    );

    if (
      statusResult.rows[0].order_id !== null &&
      statusResult.rows[0].instant_book == "PENDING"
    ) {
      await client.query("ROLLBACK");
      await redisService.releaseLock(`chef_lock_${chef_id}`);
      return res.status(400).json({
        success: false,
        message: "Chef is not available for instant booking",
      });
    }

    await client.query("COMMIT");

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
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Error during ROLLBACK:", rollbackErr);
    }

    try {
      await redisClient.del(`instant_booking:${chef_id}`);
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
      console.warn(
        `⚠️ Warning: Key ${activeRequestKey} has no expiration set.`
      );
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
      message:
        "Instant booking status updated to CANCELLED, and chef notified.",
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
  chef_latitude: Joi.number().required(), // Added latitude validation
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

  const {
    chef_id,
    customer_id,
    recipe_id,
    response,
    chef_latitude,
    chef_longitude,
  } = value;
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
      const reqDataJson = await JSON.parse(reqData);

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
          [
            customer_id,
            chef_id,
            recipe_id,
            1000,
            "PENDING",
            reqDataJson.latitude,
            reqDataJson.longitude,
            chef_latitude,
            chef_longitude,
          ]
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
        chef_longitude: chef_longitude,
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
        chef_longitude: chef_longitude,
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
    } else {
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

router.post("/advance/complete", async (req, res) => {
  const { order_id } = req.query;

  if (!order_id) {
    return res
      .status(400)
      .json({ success: false, message: "order_id is required" });
  }

  try {
    // Retrieve the pending order
    const orderResult = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 AND status = 'CONFIRMED' LIMIT 1`,
      [order_id]
    );

    if (orderResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not in a CONFIRMED state.",
      });
    }

    // Update the order status to CONFIRMED
    const updateResult = await client.query(
      `UPDATE orders 
       SET status = 'COMPLETED'
       WHERE order_id = $1 
       RETURNING *`,
      [order_id]
    );

    // Optionally, you can trigger notifications here (e.g., using FCM)
    // await sendFCMNotification(...);

    return res.status(200).json({
      success: true,
      message: "Order has been completed successfully.",
      order: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error completing advance booking: ", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

router.post("/advance/cancel", async (req, res) => {
  const { order_id } = req.query;

  if (!order_id) {
    return res
      .status(400)
      .json({ success: false, message: "order_id is required" });
  }

  try {
    // Retrieve the pending order
    const orderResult = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 AND status = 'CONFIRMED' LIMIT 1`,
      [order_id]
    );

    if (orderResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not in a CONFIRMED state.",
      });
    }

    // Update the order status to CONFIRMED
    const updateResult = await client.query(
      `UPDATE orders 
       SET status = 'CANCELLED'
       WHERE order_id = $1 
       RETURNING *`,
      [order_id]
    );

    // Optionally, you can trigger notifications here (e.g., using FCM)
    // await sendFCMNotification(...);

    return res.status(200).json({
      success: true,
      message: "Order has been cancelled successfully.",
      order: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error cancelling advance booking: ", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

router.post("/advance/request/accept", async (req, res) => {
  const { order_id } = req.query;

  if (!order_id) {
    return res
      .status(400)
      .json({ success: false, message: "order_id is required" });
  }

  try {
    // Retrieve the pending order
    const orderResult = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 AND status = 'PENDING' LIMIT 1`,
      [order_id]
    );

    if (orderResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not in a PENDING state.",
      });
    }

    // Update the order status to CONFIRMED
    const updateResult = await client.query(
      `UPDATE orders 
       SET status = 'CONFIRMED'
       WHERE order_id = $1 
       RETURNING *`,
      [order_id]
    );

    // Optionally, you can trigger notifications here (e.g., using FCM)
    // await sendFCMNotification(...);

    return res.status(200).json({
      success: true,
      message: "Order has been accepted successfully.",
      order: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error accepting advance booking: ", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});
router.post("/advance/request/reject", async (req, res) => {
  const { order_id } = req.query;

  if (!order_id) {
    return res
      .status(400)
      .json({ success: false, message: "order_id is required" });
  }

  try {
    // Retrieve the pending order
    const orderResult = await client.query(
      `SELECT * FROM orders WHERE order_id = $1 AND status = 'PENDING' LIMIT 1`,
      [order_id]
    );

    if (orderResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not in a PENDING state.",
      });
    }

    // Update the order status to CONFIRMED
    const updateResult = await client.query(
      `UPDATE orders 
       SET status = 'REJECTED'
       WHERE order_id = $1 
       RETURNING *`,
      [order_id]
    );

    // Optionally, you can trigger notifications here (e.g., using FCM)
    // await sendFCMNotification(...);

    return res.status(200).json({
      success: true,
      message: "Order has been rejected successfully.",
      order: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error rejecting advance booking: ", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

// Advanced booking logic
const advanceBookingSchema = Joi.object({
  chef_id: Joi.string().required(),
  customer_id: Joi.string().required(),
  recipe_id: Joi.number().integer().required(),
  latitude: Joi.number().required(), // 📍 Latitude
  longitude: Joi.number().required(), // 📍 Longitude
  start_date: Joi.string().required(),
});

router.post("/advance", async (req, res) => {
  console.log("📩 Incoming Request Body:", req.body);
  const { error, value } = advanceBookingSchema.validate(req.body);
  if (error) {
    console.log("🚫 Validation Error:", error);
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }

  const { chef_id, customer_id, recipe_id, latitude, longitude, start_date } =
    value;

  try {
    console.log("\nADVANCE BOOKING--------------");

    // Ensure start_date is in the future
    const curOrderStart = new Date(start_date);
    console.log("CurOrderStart: ", curOrderStart.toLocaleString());
    if (curOrderStart <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Booking date must be in the future.",
      });
    }

    // Validate if recipe belongs to chef
    const recipeResult = await client.query(
      `SELECT * 
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

    const recipe = recipeResult.rows[0];
    const prepTime = Number(recipe.preparation_time);
    if (isNaN(prepTime)) {
      throw new Error("Invalid preparation_time");
    }

    // Calculate current order's end time based on preparation_time
    const curOrderEnd = new Date(curOrderStart.getTime() + prepTime * 60000);
    const curOrderDurationMs = curOrderEnd.getTime() - curOrderStart.getTime();
    console.log(
      "CurOrderEnd: ",
      curOrderEnd.toLocaleString(),
      "\nDuration: ",
      curOrderDurationMs / 60000
    );
    // Define a fixed buffer time in minutes (could be made dynamic)
    const bufferTime = 30;

    const prevOrderDirectCollisionResult = await client.query(
      `SELECT * FROM orders 
      WHERE chef_id = $1 
        AND status = 'CONFIRMED' 
        AND DATE(end_date_time) = DATE($2)
        AND end_date_time >= $2 AND start_date_time <= $2
      ORDER BY end_date_time DESC LIMIT 1`,
      [chef_id, curOrderStart]
    );

    const prevDirecCollisionOrder =
      prevOrderDirectCollisionResult.rowCount > 0
        ? prevOrderDirectCollisionResult.rows[0]
        : null;

    if (prevDirecCollisionOrder) {
      console.log(
        "DIRECT COLLISION with PREV order: ",
        prevDirecCollisionOrder.order_id
      );
      return res.status(409).json({
        success: false,
        message:
          "Booking collision: Cannot accommodate the booking. [Direct Collison with PREV ORDER]. Suggested Start after: " +
          prevDirecCollisionOrder.end_date_time,
      });
    }

    const nextOrderDirectCollisionResult = await client.query(
      `SELECT * FROM orders 
    WHERE chef_id = $1 
      AND status = 'CONFIRMED' 
      AND DATE(start_date_time) = DATE($2)
      AND start_date_time <= $2 AND end_date_time >= $2
    ORDER BY start_date_time ASC LIMIT 1`,
      [chef_id, curOrderEnd]
    );

    const nextDirectCollisionOrder =
      nextOrderDirectCollisionResult.rowCount > 0
        ? nextOrderDirectCollisionResult.rows[0]
        : null;
    if (nextDirectCollisionOrder) {
      console.log(
        "DIRECT COLLISION with NEXT order: ",
        nextDirectCollisionOrder.order_id
      );
      const suggestedStartTime = new Date(
        new Date(nextDirectCollisionOrder.start_date_time).getTime() -
          curOrderDurationMs
      );
      return res.status(409).json({
        success: false,
        message:
          "Booking collision: Cannot accommodate the booking [Directo Collison with NEXT ORDER]. Suggested Start before: " +
          suggestedStartTime,
      });
    }

    // Retrieve previous confirmed order (if any) that ends before current order starts and is on the same day
    const prevOrderResult = await client.query(
      `SELECT * FROM orders 
      WHERE chef_id = $1 
        AND status = 'CONFIRMED' 
        AND DATE(end_date_time) = DATE($2)
        AND end_date_time <= $2
      ORDER BY end_date_time DESC LIMIT 1`,
      [chef_id, curOrderStart]
    );

    const prevOrder =
      prevOrderResult.rowCount > 0 ? prevOrderResult.rows[0] : null;

    // Retrieve next confirmed order (if any) that starts after current order ends and is on the same day as curOrderStart
    const nextOrderResult = await client.query(
      `SELECT * FROM orders 
      WHERE chef_id = $1 
        AND status = 'CONFIRMED' 
        AND start_date_time >= $2 
        AND DATE(start_date_time) = DATE($2)
      ORDER BY start_date_time ASC LIMIT 1`,
      [chef_id, curOrderStart]
    );

    const nextOrder =
      nextOrderResult.rowCount > 0 ? nextOrderResult.rows[0] : null;

    let startLimit = null;
    let endLimit = null;

    // Head Clash Check: If there is a previous order, determine the earliest start allowed.
    if (prevOrder) {
      console.log("Previous order id: ", prevOrder?.order_id || "N/A");

      const departureDate = new Date(prevOrder.end_date_time);
      const originLoc = { lat: prevOrder.latitude, long: prevOrder.longitude };
      const headETA = await getETA(
        originLoc,
        { lat: latitude, long: longitude },
        departureDate
      );
      // startLimit = previous order's end + ETA + buffer
      startLimit = new Date(departureDate.getTime() + headETA * 60000);

      console.log(
        "PrevOrder ETA(mins): ",
        headETA,
        " startLimit: ",
        startLimit.toLocaleString()
      );
    }

    // Tail Clash Check: If there is a next order, determine the latest end allowed.
    if (nextOrder) {
      console.log("Next order id: ", nextOrder.order_id);

      const destLoc = { lat: nextOrder.latitude, long: nextOrder.longitude };
      const tailETA = await getETA(
        { lat: latitude, long: longitude },
        destLoc,
        curOrderEnd
      );
      // endLimit = next order's start - (ETA + buffer)
      const nextOrderStart = new Date(nextOrder.start_date_time);
      endLimit = new Date(nextOrderStart.getTime() - tailETA * 60000);

      console.log(
        "NextOrder ETA(mins): ",
        tailETA,
        "\nNextOrder Start: ",
        nextOrderStart.toLocaleString(),
        "\nendLimit: ",
        endLimit.toLocaleString()
      );
    }

    // Define acceptable overlap (in minutes) -- the extra overlap allowed in the gap calculation
    const acceptableOverlap = 10;
    const acceptableOverlapMs = acceptableOverlap * 60000;

    // Ensure that the order is possible to fit within the gap
    if (startLimit && endLimit) {
      const availableGapMs = endLimit.getTime() - startLimit.getTime();

      const diffMs = availableGapMs - curOrderDurationMs;
      console.log("Overlap: ", diffMs);
      if (diffMs < -acceptableOverlapMs) {
        return res.status(409).json({
          success: false,
          message: "Booking collision: Cannot accommodate the booking.",
        });
      }
    }

    // Nudge the order start_date to adjust if necessary
    if (startLimit && curOrderStart < startLimit) {
      // HEAD CLASH
      const date = startLimit;
      console.log("HEAD COLLISION - Suggested Start: ", date.toLocaleString());
      return res.status(409).json({
        success: false,
        message: `Booking collision (HEAD): Suggested new start_date is ${date.toLocaleString()}`,
      });
    } else if (endLimit && curOrderEnd > endLimit) {
      const date = startLimit
        ? startLimit
        : new Date(endLimit.getTime() - curOrderDurationMs);
      console.log("TAIL COLLISION - Suggested Start: ", date.toLocaleString());
      return res.status(409).json({
        success: false,
        message: `Booking collision (TAIL): Suggested new start_date is ${date.toLocaleString()}`,
      });
    }

    const orderResult = await client.query(
      `INSERT INTO orders (
        customer_id, chef_id, recipe_id, total_price, status, type,
        start_date_time, end_date_time, latitude, longitude, chef_latitude, chef_longitude
     )
     VALUES ($1, $2, $3, $4, 'PENDING', 'ADVANCE', $5, $6, $7, $8, null, null)
     RETURNING order_id`,
      [
        customer_id,
        chef_id,
        recipe_id,
        recipe.price,
        start_date,
        curOrderEnd,
        latitude,
        longitude,
      ]
    );

    return res.status(200).json({
      success: true,
      message: `Order Placed!!`,
    });

    // NO CLASH, GO AHEAD AND CREATE THE ORDER
  } catch (err) {
    console.error("Error advance booking: ", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Error processing your advance booking",
    });
  }
});

router.get("/check/:order_id/:chef_id", async (req, res) => {
  const chef_id = req.params.chef_id;
  const order_id = req.params.order_id;
  console.log("Checking for order clashes...", chef_id, order_id);

  if (!chef_id || !order_id) {
    return res.status(400).json({
      success: false,
      message: "chef_id and order_id are required",
    });
  }

  try {
    // 1. Fetch the order to check
    const orderResult = await client.query(
      `SELECT * FROM orders 
      WHERE chef_id = $1 
      AND order_id = $2
      AND status = 'PENDING'`,
      [chef_id, order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not in a PENDING state.",
      });
    }

    const currentOrder = orderResult.rows[0];
    const curOrderStart = new Date(currentOrder.start_date_time);
    const curOrderEnd = new Date(currentOrder.end_date_time);
    const curOrderDurationMs = curOrderEnd - curOrderStart;

    const latitude = currentOrder.latitude;
    const longitude = currentOrder.longitude;

    // 2. Fetch ALL other orders on the same day for the chef
    const remainingOrdersResult = await client.query(
      `SELECT * FROM orders 
      WHERE chef_id = $1 
      AND status = 'PENDING'
      AND DATE(start_date_time) = DATE($2)
      AND order_id != $3
      ORDER BY start_date_time ASC`,
      [chef_id, currentOrder.start_date_time, order_id]
    );

    
    const remainingOrders = remainingOrdersResult.rows;
    
    console.log("[CLASH CHECK] Orders on the same date as cur order: ", 
    remainingOrders.map(o => o.order_id))

    const clashingOrders = [];

    for (let otherOrder of remainingOrders) {
      const otherStart = new Date(otherOrder.start_date_time);
      const otherEnd = new Date(otherOrder.end_date_time);

      // === TIME OVERLAP CHECK ===
      const isTimeOverlap =
        curOrderStart < otherEnd && curOrderEnd > otherStart;

      if (isTimeOverlap) {
        console.log(`Time clash with order ${otherOrder.order_id}`);
        clashingOrders.push({
          type: "TIME_OVERLAP",
          order: otherOrder,
          details: `Order overlaps with start ${otherStart} to end ${otherEnd}`,
        });
        continue; // No need to check travel feasibility if times already clash
      }

      // === TRAVEL FEASIBILITY CHECK ===
      let travelClash = false;

      // Case 1: currentOrder is BEFORE otherOrder
      if (curOrderEnd <= otherStart) {
        const curEndTime = curOrderEnd;
        const destLoc = {
          lat: otherOrder.latitude,
          long: otherOrder.longitude,
        };

        const tailETA = await getETA(
          { lat: latitude, long: longitude },
          destLoc,
          curEndTime
        );
        console.log("[CLASH CHECK] TRAVEL CLASH BEFORE: ",tailETA)

        const arrivalTime = new Date(curEndTime.getTime() + tailETA * 60000);

        if (arrivalTime > otherStart) {
          travelClash = true;
          console.log(
            `Travel clash (too late) to order ${
              otherOrder.order_id
            }: arrival at ${arrivalTime.toLocaleString()} after start ${otherStart.toLocaleString()}`
          );
        }
      }

      // Case 2: currentOrder is AFTER otherOrder
      if (curOrderStart >= otherEnd) {
        const otherEndTime = otherEnd;
        const originLoc = {
          lat: otherOrder.latitude,
          long: otherOrder.longitude,
        };

        const headETA = await getETA(
          originLoc,
          { lat: latitude, long: longitude },
          otherEndTime
        );
        console.log("[CLASH CHECK] TRAVEL CLASH AFTER: ",headETA)
        const arrivalTime = new Date(otherEndTime.getTime() + headETA * 60000);

        if (arrivalTime > curOrderStart) {
          travelClash = true;
          console.log(
            `Travel clash (too late) from order ${
              otherOrder.order_id
            }: arrival at ${arrivalTime.toLocaleString()} after start ${curOrderStart.toLocaleString()}`
          );
        }
      }

      if (travelClash) {
        clashingOrders.push({
          type: "TRAVEL_ISSUE",
          order: otherOrder,
          details: `Not enough travel time between orders.`,
        });
      }
    }

    // 3. Return all clashes
    if (clashingOrders.length > 0) {
      return res.status(200).json({
        success: true,
        message: `Found ${clashingOrders.length} clashing orders.`,
        clashes: clashingOrders,
        checkedOrder: currentOrder,
      });
    }

    return res.status(200).json({
      success: true,
      message: "No clashes found.",
      checkedOrder: currentOrder,
    });
  } catch (error) {
    console.error("Error checking for clashes:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while checking orders.",
      error: error.message,
    });
  }
});

router.get("/advance/startorder/:chef_id/:order_id", async (req, res) => {
  try {
    const { chef_id, order_id } = req.params;

    if (!chef_id || !order_id) {
      return res.status(400).json({ error: "Missing chef_id or order_id" });
    }

    const key = `chef_cur_order:${chef_id}`;

    await redisClient.set(key, order_id); // Set with a 1-hour expiry

    res.json({
      success: true,
      message: "Chef order tracking started",
      chef_id,
      order_id,
    });
  } catch (error) {
    console.error("Error starting order tracking:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/advance/curorder/:chef_id", async (req, res) => {
  try {
    const { chef_id } = req.params;

    if (!chef_id) {
      return res.status(400).json({ error: "Missing chef_id" });
    }

    const key = `chef_cur_order:${chef_id}`;

    const order_id = await redisClient.get(key);

    if (!order_id) {
      return res.json({
        chef_id,
        order_id: null,
        message: "No active order found",
      });
    }

    res.json({ chef_id, order_id });
  } catch (error) {
    console.error("Error retrieving chef's current order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper: Get ETA (in minutes) 
const getETA = async (origin, destination, departureDate) => {
  const departureTimeSec = Math.floor(new Date(departureDate).getTime() / 1000);
  const url = `https://routes.googleapis.com/directions/v2:computeRoutes`;

  const requestBody = {
    origin: {
      location: {
        latLng: { latitude: origin.lat, longitude: origin.long },
      },
    },
    destination: {
      location: {
        latLng: { latitude: destination.lat, longitude: destination.long },
      },
    },
    travelMode: "DRIVE", // Change to "WALK", "BICYCLE", or "TRANSIT" if needed
    routingPreference: "TRAFFIC_AWARE", // Consider real-time traffic data
    departureTime: departureTimeSec ? new Date(departureTimeSec * 1000).toISOString() : undefined,
    computeAlternativeRoutes: false,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "routes.duration",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch data from Google Routes API");
  }

  const data = await response.json();
  console.log("ETA response: ", data);

  // Convert seconds to minutes
  const seconds = data.routes[0]?.duration.split("s")[0];
  return  parseInt(seconds)/ 60;
};


module.exports = router;
