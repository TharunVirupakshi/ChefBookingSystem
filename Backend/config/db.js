const { Pool } = require('pg');
const client = new Pool({
    user: 'postgres',
    password: 'root',
    host: 'localhost',
    port: 5432,
    database: 'ChefBookingSysDB',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
})

module.exports = client;