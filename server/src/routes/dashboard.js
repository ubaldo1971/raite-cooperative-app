const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/summary/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Mock calculations based on transactions
        const transactions = db.getTransactions(userId);

        // Tokens (sum 'token_purchase')
        const tokens = transactions
            .filter(t => t.type === 'token_purchase')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 1250;

        // Earnings (sum 'earnings' last 30 days) - Mock logic: just sum all earnings for demo
        const earnings = transactions
            .filter(t => t.type === 'earnings')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 12450.00;

        // Next Payment
        const nextPayment = "15 Dic"; // Fixed for demo

        res.json({
            tokens: parseInt(tokens),
            earnings: parseFloat(earnings),
            nextPayment
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
