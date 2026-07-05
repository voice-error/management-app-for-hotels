// middleware/tenantAuth.js
const jwt = require('jsonwebtoken');

function requireTenantAuth(req, res, next) {
    // 1. Check if the token exists in header or cookie
    let token = req.cookies.saas_auth_token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        // 2. Verify the token signature
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

        // 3. INJECT THE ISOLATION CONTEXT
        // We attach the businessId to the request object. 
        // Now, every downstream route knows exactly who is asking.
        req.userContext = {
            userId: decodedPayload.userId,
            name: decodedPayload.name,
            businessId: decodedPayload.businessId,
            role: decodedPayload.role
        };

        next(); // Move on to the actual route

    } catch (error) {
        // Token is expired, tampered with, or invalid
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

module.exports = requireTenantAuth;