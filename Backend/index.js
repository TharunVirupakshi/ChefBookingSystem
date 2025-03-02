const express = require('express');
const cors = require('cors')
const app = express()
app.use(cors())
const router = express.Router()
app.use(express.json())

const client = require('./config/db');

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});