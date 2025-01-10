const express = require('express');


const app = express()
const router = express.Router()
app.use(express.json())

const client = require('./config/db');

client.connect()
    .then(()=>console.log("Connected to Postgres"))
    .catch(e => console.log("Error: ", e))


app.get('/', (req, res) => {
    res.status(200).send('Hello!');
})


const chefRoutes = require('./routes/chefRoutes')
app.use('/api/chefs', chefRoutes)

const customerRoutes = require('./routes/customerRoutes')
app.use('/api/customers', customerRoutes)

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});