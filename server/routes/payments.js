const express = require('express');
const router = express.Router();
const paymentModel = require('../models/paymentModel');

// Get filter payments
router.get('/', async (req, res) => {
    try {
        let payments = await paymentModel.getAllPayments();
        
        // Apply filters
        if (req.query.tenantId) {
            payments = payments.filter(p => p.tenantId === req.query.tenantId);
        }
        if (req.query.month) {
            payments = payments.filter(p => p.month == req.query.month);
        }
        if (req.query.year) {
            payments = payments.filter(p => p.year == req.query.year);
        }
        if (req.query.type) {
            payments = payments.filter(p => p.type === req.query.type);
        }
        
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Record new payment or deposit
router.post('/', async (req, res) => {
    try {
        const newPayment = await paymentModel.recordPayment(req.body);
        res.status(201).json(newPayment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete payment
router.delete('/:id', async (req, res) => {
    try {
        await paymentModel.deletePayment(req.params.id);
        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add this route to get single payment
router.get('/:id', async (req, res) => {
    try {
        const payments = await paymentModel.getAllPayments();
        const payment = payments.find(p => p.id === req.params.id);
        
        if (payment) {
            res.json(payment);
        } else {
            res.status(404).json({ error: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get recent payments (last 5)
router.get('/recent', async (req, res) => {
    try {
        let payments = await paymentModel.getAllPayments();
        // Filter out security deposits
        payments = payments.filter(p => p.type !== 'security_deposit');
        // Sort by date (newest first)
        payments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
        // Get top 5
        payments = payments.slice(0, 5);
        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;