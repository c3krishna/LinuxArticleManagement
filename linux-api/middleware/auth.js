const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Extract token from "Bearer <token>"
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'cM9PU9dJQp1YwUUPRtJGBOdY245YueAR2DszAtv2FRg='
        );

        // Attach user info to request
        req.user = decoded;
        next();

    } catch (err) {
        console.log('Auth error:', err.message);
        
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: err.message
        });
    }
};

module.exports = auth;
