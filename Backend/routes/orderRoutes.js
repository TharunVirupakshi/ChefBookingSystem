const express = require('express');
const router = express.Router();
const client = require('../config/db'); 
const joi = require('joi');

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

module.exports = router

