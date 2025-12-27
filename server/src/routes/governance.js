const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Multer Storage for Docs
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `doc-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Get Official Documents
router.get('/documents', async (req, res) => {
    try {
        const docs = db.getDocuments();
        res.json(docs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload Official Document (Admin)
router.post('/documents', upload.single('document'), async (req, res) => {
    try {
        // Assume auth middleware checked role='admin'
        const { title } = req.body;
        const uploadedBy = 1; // Mock Admin ID

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        const fileSize = `${(req.file.size / 1024 / 1024).toFixed(1)} MB`; // Simple Mock Size format

        const newDoc = db.addDocument({
            title: title || req.file.originalname,
            filename: req.file.originalname,
            url: fileUrl,
            size: fileSize,
            uploaded_by: uploadedBy
        });

        res.json(newDoc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Document (Admin)
router.delete('/documents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        db.deleteDocument(id);
        res.json({ message: 'Document deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cast Vote
router.post('/vote', async (req, res) => {
    try {
        const { userId, option, note } = req.body;

        try {
            db.vote({
                user_id: parseInt(userId),
                poll_id: 'presupuesto_2024',
                vote_option: option,
                note
            });
            res.json({ message: 'Voto registrado exitosamente' });
        } catch (e) {
            return res.status(400).json({ message: e.message });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Live Vote Stats
router.get('/stats', async (req, res) => {
    try {
        const stats = db.getVoteStats('presupuesto_2024');
        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== PROPOSALS API =====

// Get all proposals
router.get('/proposals', async (req, res) => {
    try {
        const proposals = db.getProposals();
        res.json(proposals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new proposal
router.post('/proposals', async (req, res) => {
    try {
        const { title, description, endDate, status } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        const proposal = db.createProposal({
            title,
            description: description || '',
            endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: status || 'active'
        });
        res.json(proposal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update proposal (status, votes, etc)
router.put('/proposals/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const proposal = db.updateProposal(id, updates);
        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }
        res.json(proposal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete proposal
router.delete('/proposals/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = db.deleteProposal(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Proposal not found' });
        }
        res.json({ message: 'Proposal deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Vote on a proposal
router.post('/proposals/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body; // 'favor' | 'contra' | 'abstencion'
        if (!['favor', 'contra', 'abstencion'].includes(voteType)) {
            return res.status(400).json({ message: 'Invalid vote type' });
        }
        const proposal = db.voteOnProposal(id, voteType);
        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }
        res.json(proposal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
