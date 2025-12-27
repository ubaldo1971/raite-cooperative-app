const { verifyToken } = require('../utils/auth');

/**
 * Middleware to verify JWT token and protect routes
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de autenticación requerido'
        });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(403).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }

    // Attach user info to request
    req.user = decoded;
    next();
}

/**
 * Middleware to check if user is admin
 */
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador.'
        });
    }
    next();
}

module.exports = {
    authenticateToken,
    requireAdmin
};
