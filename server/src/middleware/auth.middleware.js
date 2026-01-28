const jwt = require('jsonwebtoken');
const db = require('../models');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await db.User.findByPk(decoded.id, {
        attributes: {
          exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Authorization denied.',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact administrator.',
        });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authorization denied.',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
    });
  }
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

// Optional auth - doesn't fail if no token, but populates user if present
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.User.findByPk(decoded.id, {
        attributes: {
          exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
        },
      });

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (err) {
      // Token invalid, but we don't fail - just proceed without user
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { auth, authorize, optionalAuth };
