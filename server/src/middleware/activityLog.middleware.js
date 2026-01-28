const db = require('../models');

const logActivity = async (
  userId,
  action,
  entityType,
  entityId,
  description,
  oldValues = null,
  newValues = null,
  req = null
) => {
  try {
    await db.ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      description,
      oldValues,
      newValues,
      ipAddress: req ? req.ip || req.connection.remoteAddress : null,
      userAgent: req ? req.get('User-Agent') : null,
    });
  } catch (error) {
    console.error('Activity logging error:', error);
    // Don't throw - logging shouldn't break the main operation
  }
};

// Middleware version for automatic logging
const activityLogger = (action, entityType) => {
  return async (req, res, next) => {
    // Store original json function
    const originalJson = res.json;

    res.json = function (data) {
      // Log after successful response
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        logActivity(
          req.user.id,
          action,
          entityType,
          data?.data?.id || req.params.id,
          `${action} ${entityType}`,
          null,
          null,
          req
        );
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = { logActivity, activityLogger };
