const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all commitments (admin) or by user
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        const commitments = db.getCommitments(userId);
        res.json(commitments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get commitments for specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const commitments = db.getCommitments(userId);
        res.json(commitments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get payment report with user details
router.get('/report', async (req, res) => {
    try {
        const commitments = db.getCommitments();
        const users = db.getAllUsers();

        const report = commitments.map(c => {
            const user = users.find(u => u.id === c.userId);
            const today = new Date();
            const dueDate = new Date(c.dueDate);
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            return {
                ...c,
                userName: user?.full_name || 'Usuario Desconocido',
                userCurp: user?.curp?.substring(0, 4) || 'N/A',
                daysUntilDue: diffDays,
                isOverdue: diffDays < 0 && c.status === 'pending'
            };
        });

        res.json(report);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new commitment (admin) - single user or ALL users
router.post('/', async (req, res) => {
    try {
        const { userId, type, concept, amount, dueDate, applyToAll } = req.body;

        if (!amount || !dueDate) {
            return res.status(400).json({ message: 'amount and dueDate are required' });
        }

        // If applyToAll is true, create commitment for all active users
        if (applyToAll) {
            const users = db.getAllUsers().filter(u => u.status === 'active' || !u.status);
            const created = [];

            for (const user of users) {
                const commitment = db.createCommitment({
                    userId: user.id,
                    type: type || 'cuota',
                    concept: concept || 'Cuota Cooperativa',
                    amount: parseFloat(amount),
                    dueDate
                });
                created.push(commitment);
            }

            return res.json({
                message: `Creados ${created.length} compromisos para todos los usuarios`,
                count: created.length,
                commitments: created
            });
        }

        // Single user commitment
        if (!userId) {
            return res.status(400).json({ message: 'userId is required for individual commitment' });
        }

        const commitment = db.createCommitment({
            userId,
            type: type || 'cuota',
            concept: concept || 'Cuota Cooperativa',
            amount: parseFloat(amount),
            dueDate
        });

        res.json(commitment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update commitment status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const commitment = db.updateCommitmentStatus(id, status);
        if (!commitment) {
            return res.status(404).json({ message: 'Commitment not found' });
        }

        res.json(commitment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete commitment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = db.deleteCommitment(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Commitment not found' });
        }
        res.json({ message: 'Commitment deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
