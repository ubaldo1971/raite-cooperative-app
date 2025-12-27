const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// NOTE: JWT authentication disabled for development
// The admin panel uses its own password-based authentication (raite2024)
// In production, re-enable these lines:
// router.use(authenticateToken);
// router.use(requireAdmin);

/**
 * GET /api/admin/users
 * Get all users with optional filter by status
 */
router.get('/users', async (req, res) => {
    try {
        const { status } = req.query;

        let users;
        if (status) {
            users = db.getUsersByStatus(status);
        } else {
            users = db.getAllUsers();
        }

        // Remove passwords from response
        const safeUsers = users.map(u => {
            const user = { ...u };
            delete user.password_hash;
            return user;
        });

        res.json({
            success: true,
            users: safeUsers,
            count: safeUsers.length
        });
    } catch (err) {
        console.error('Admin get users error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * GET /api/admin/users/pending
 * Get users pending approval
 */
router.get('/users/pending', async (req, res) => {
    try {
        const pendingUsers = db.getUsersByStatus('pending');

        const safeUsers = pendingUsers.map(u => {
            const user = { ...u };
            delete user.password_hash;
            return user;
        });

        res.json({
            success: true,
            users: safeUsers,
            count: safeUsers.length
        });
    } catch (err) {
        console.error('Error getting pending users:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * GET /api/admin/users/:id
 * Get detailed user info
 */
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = db.getUserById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const safeUser = { ...user };
        delete safeUser.password_hash;

        res.json({
            success: true,
            user: safeUser
        });
    } catch (err) {
        console.error('Error getting user:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * POST /api/admin/users/:id/approve
 * Approve a pending user
 */
router.post('/users/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        const user = db.getUserById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (user.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `El usuario ya está en estado: ${user.status}`
            });
        }

        // Update status to approved
        db.updateUserStatus(id, 'approved');

        // Add admin note
        if (note) {
            db.addAdminNote(id, `Aprobado: ${note}`, req.user.userId);
        } else {
            db.addAdminNote(id, 'Usuario aprobado', req.user.userId);
        }

        // TODO: Send approval notification email/SMS

        const updatedUser = db.getUserById(id);
        const safeUser = { ...updatedUser };
        delete safeUser.password_hash;

        res.json({
            success: true,
            message: 'Usuario aprobado exitosamente',
            user: safeUser
        });
    } catch (err) {
        console.error('Error approving user:', err);
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: err.message
        });
    }
});

/**
 * POST /api/admin/users/:id/reject
 * Reject a pending user
 */
router.post('/users/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const user = db.getUserById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere una razón para el rechazo'
            });
        }

        // Update status to rejected
        db.updateUserStatus(id, 'rejected');

        // Add admin note with reason
        db.addAdminNote(id, `Rechazado: ${reason}`, req.user.userId);

        // TODO: Send rejection notification email/SMS

        const updatedUser = db.getUserById(id);
        const safeUser = { ...updatedUser };
        delete safeUser.password_hash;

        res.json({
            success: true,
            message: 'Usuario rechazado',
            user: safeUser
        });
    } catch (err) {
        console.error('Error rejecting user:', err);
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: err.message
        });
    }
});

/**
 * POST /api/admin/users/:id/activate
 * Activate an approved user (make fully active)
 */
router.post('/users/:id/activate', async (req, res) => {
    try {
        const { id } = req.params;

        const user = db.getUserById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (user.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Solo usuarios aprobados pueden ser activados'
            });
        }

        // Update status to active
        db.updateUserStatus(id, 'active');

        // Add admin note
        db.addAdminNote(id, 'Usuario activado', req.user.userId);

        const updatedUser = db.getUserById(id);
        const safeUser = { ...updatedUser };
        delete safeUser.password_hash;

        res.json({
            success: true,
            message: 'Usuario activado exitosamente',
            user: safeUser
        });
    } catch (err) {
        console.error('Error activating user:', err);
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: err.message
        });
    }
});

/**
 * POST /api/admin/users/:id/suspend
 * Suspend a user
 */
router.post('/users/:id/suspend', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const user = db.getUserById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere una razón para la suspensión'
            });
        }

        // Update status to suspended
        db.updateUserStatus(id, 'suspended');

        // Add admin note with reason
        db.addAdminNote(id, `Suspendido: ${reason}`, req.user.userId);

        const updatedUser = db.getUserById(id);
        const safeUser = { ...updatedUser };
        delete safeUser.password_hash;

        res.json({
            success: true,
            message: 'Usuario suspendido',
            user: safeUser
        });
    } catch (err) {
        console.error('Error suspending user:', err);
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: err.message
        });
    }
});

/**
 * POST /api/admin/users/:id/notes
 * Add a note to user account
 */
router.post('/users/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        if (!note) {
            return res.status(400).json({
                success: false,
                message: 'La nota no puede estar vacía'
            });
        }

        const user = db.getUserById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        db.addAdminNote(id, note, req.user.userId);

        const updatedUser = db.getUserById(id);
        const safeUser = { ...updatedUser };
        delete safeUser.password_hash;

        res.json({
            success: true,
            message: 'Nota agregada',
            user: safeUser
        });
    } catch (err) {
        console.error('Error adding note:', err);
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: err.message
        });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user (existing endpoint)
 */
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Intentando eliminar usuario ID:', id);
        const result = db.deleteUser(id);
        console.log('🗑️ Resultado:', result);
        if (result) {
            res.json({ success: true, message: 'Usuario eliminado' });
        } else {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
    } catch (err) {
        console.error('Admin delete user error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * PUT /api/admin/users/:id
 * Update user (existing endpoint)
 */
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        console.log('✏️ Actualizando usuario ID:', id, updates);
        const result = db.updateUser(id, updates);
        if (result) {
            const safeUser = { ...result };
            delete safeUser.password_hash;
            res.json({
                success: true,
                message: 'Usuario actualizado',
                user: safeUser
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
    } catch (err) {
        console.error('Admin update user error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const allUsers = db.getAllUsers();

        const stats = {
            total: allUsers.length,
            pending: allUsers.filter(u => u.status === 'pending').length,
            approved: allUsers.filter(u => u.status === 'approved').length,
            active: allUsers.filter(u => u.status === 'active').length,
            suspended: allUsers.filter(u => u.status === 'suspended').length,
            rejected: allUsers.filter(u => u.status === 'rejected').length,

            // Document types
            ine: allUsers.filter(u => u.document_type === 'ine' || !u.document_type).length,
            license: allUsers.filter(u => u.document_type === 'license').length,

            // Verification stats
            emailVerified: allUsers.filter(u => u.email_verified).length,
            phoneVerified: allUsers.filter(u => u.phone_verified).length,
        };

        res.json({
            success: true,
            stats
        });
    } catch (err) {
        console.error('Error getting stats:', err);
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: err.message
        });
    }
});

module.exports = router;
