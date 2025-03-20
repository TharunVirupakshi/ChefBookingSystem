const express = require('express');
const cors = require('cors')
const cron = require("node-cron");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express()
app.use(cors())
const router = express.Router()
app.use(express.json())

const client = require('./config/db');
const mockDateTime = require('./config/mockDateTime')

// mockDateTime.resetMockDateTime()
const offsetHrs = 3600000 * 2; // 1hr
// mockDateTime.setMockDateTime(offsetHrs)
console.log("MockDateTime: ", mockDateTime.getMockDateTime().toLocaleString())
console.log("PG MockDateTime: ", mockDateTime.getPGMockDateTime())

const imagesDir = path.join(__dirname, "imagesDB", "Images")
const dataFile = path.join(__dirname, "imagesDB", "imagesMap.json")

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}else{
  console.error("ImageDB DIR error") 
}

// Load or initialize the mapping file
let imagesMap = {};
if (fs.existsSync(dataFile)) {
  imagesMap = JSON.parse(fs.readFileSync(dataFile));
}else{
  console.error("ImageDB MAP error")
}


// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: imagesDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// **Upload an Image and Update JSON**
app.post("/upload", upload.single("image"), (req, res) => {
  const { recipeId } = req.body;
  if (!recipeId || !req.file) {
    return res.status(400).json({ error: "Missing recipeId or image" });
  }

  imagesMap[recipeId] = req.file.filename;

  fs.writeFileSync(dataFile, JSON.stringify(imagesMap, null, 2));

  res.json({ message: "Image uploaded successfully", filename: req.file.filename });
});


// **Get Image URL by Recipe ID**
app.get("/getImage/:recipeId", (req, res) => {
  const { recipeId } = req.params;
  const filename = imagesMap[recipeId];

  if (filename) {
    res.json({ imageUrl: `${req.protocol}://${req.get("host")}/images/${filename}` });
  } else {
    res.json({ imageUrl: `${req.protocol}://${req.get("host")}/images/generic.png` }); // Default image
  }
});

// Serve static files from the images directory
app.use("/images", express.static(path.join(__dirname, "imagesDB/Images")));

client.connect()
    .then(()=>console.log("Connected to Postgres"))
    .catch(e => console.log("Error: ", e))

const { setupAdminRoles } = require('./config/firebase');
// setupAdminRoles('PYo2y4k8CRNWGMb8aioxuUQ2XHf2'); // Run Only once


app.get('/', (req, res) => {
    res.status(200).send('Hello!');
})



const chefRoutes = require('./routes/chefRoutes')
app.use('/api/chefs', chefRoutes)

const customerRoutes = require('./routes/customerRoutes')
app.use('/api/customers', customerRoutes)

const orderRoutes = require('./routes/orderRoutes')
app.use('/api/orders', orderRoutes);

const recipeRoutes = require('./routes/recipeRoutes')
app.use('/api/recipes',recipeRoutes);

async function cleanupExpiredOrders() {
    console.log("[SCHEDULER] Running cleanupExpiredOrders...");
  
    try {
      await client.query("BEGIN"); // Start transaction
  
      
      const mockNowFormatted = mockDateTime.getPGMockDateTime(); // Convert to SQL format (without timezone)
  
      // Cancel orders older than 3 hours
      const cancelQuery = `
        UPDATE orders 
        SET status = 'CANCELLED' 
        WHERE status NOT IN ('CANCELLED', 'COMPLETED') 
        AND $1::timestamp - end_date_time > INTERVAL '3 hours';
      `;
      const cancelResult = await client.query(cancelQuery, [mockNowFormatted]);
      console.log(`Cancelled ${cancelResult.rowCount} expired orders.`);
  
      // Reject PENDING orders older than 4 hours
      const rejectQuery = `
        UPDATE orders 
        SET status = 'REJECTED' 
        WHERE status = 'PENDING' 
        AND $1::timestamp - end_date_time > INTERVAL '4 hours';
      `;
      const rejectResult = await client.query(rejectQuery, [mockNowFormatted]);
      console.log(`Rejected ${rejectResult.rowCount} pending orders.`);
  
      await client.query("COMMIT"); // Commit transaction
    } catch (error) {
      console.error("Error updating orders:", error);
      await client.query("ROLLBACK"); // Rollback on error
    }
  }

// Schedule the cron job to run every 2 minutes
cron.schedule("*/1 * * * *", () => {
    console.log("[SCHEDULER] Running scheduled job...");
    cleanupExpiredOrders();
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});