const express = require('express');
const router = express.Router();
const db = require('../db');

// Get cooperative settings
router.get('/', (req, res) => {
    try {
        const settings = db.getCooperativeSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update cooperative settings
router.put('/', (req, res) => {
    try {
        const updatedSettings = db.updateCooperativeSettings(req.body);
        res.json(updatedSettings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

module.exports = router;
