const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { auth, authorize } = require('../middleware/auth.middleware');
const { logActivity } = require('../middleware/activityLog.middleware');
const { paginate, buildPaginationResponse } = require('../utils/helpers.util');
const db = require('../models');
const { Op } = require('sequelize');

// =============== SETTINGS ROUTES ===============

// Get all settings
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { category } = req.query;
    const where = {};
    if (category) where.category = category;

    const settings = await db.Settings.findAll({ where });

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach((s) => {
      let value = s.value;
      if (s.type === 'number') value = parseFloat(value);
      else if (s.type === 'boolean') value = value === 'true';
      else if (s.type === 'json') value = JSON.parse(value || '{}');
      settingsObj[s.key] = value;
    });

    res.json({
      success: true,
      data: settingsObj,
      raw: settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings',
      error: error.message,
    });
  }
});

// Get public settings (for landing page etc)
router.get('/public', async (req, res) => {
  try {
    const settings = await db.Settings.findAll({
      where: { isPublic: true },
    });

    const settingsObj = {};
    settings.forEach((s) => {
      let value = s.value;
      if (s.type === 'number') value = parseFloat(value);
      else if (s.type === 'boolean') value = value === 'true';
      else if (s.type === 'json') value = JSON.parse(value || '{}');
      settingsObj[s.key] = value;
    });

    res.json({
      success: true,
      data: settingsObj,
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings',
      error: error.message,
    });
  }
});

// Update settings
router.put('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required',
      });
    }

    const updated = [];
    for (const [key, value] of Object.entries(settings)) {
      const [setting, created] = await db.Settings.findOrCreate({
        where: { key },
        defaults: {
          key,
          value:
            typeof value === 'object' ? JSON.stringify(value) : String(value),
          type: typeof value === 'object' ? 'json' : typeof value,
        },
      });

      if (!created) {
        await setting.update({
          value:
            typeof value === 'object' ? JSON.stringify(value) : String(value),
        });
      }
      updated.push(key);
    }

    logActivity(
      req.user.id,
      'UPDATE_SETTINGS',
      'Settings',
      null,
      `Updated settings: ${updated.join(', ')}`,
      null,
      settings,
      req
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { updated },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
});

// =============== ACTIVITY LOGS ===============

// Get activity logs
router.get('/activity-logs', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      entityType,
      startDate,
      endDate,
    } = req.query;
    const { limit: limitVal, offset } = paginate(page, limit);

    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = { [Op.like]: `%${action}%` };
    if (entityType) where.entityType = entityType;
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { count, rows: logs } = await db.ActivityLog.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
      ],
      limit: limitVal,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      ...buildPaginationResponse(logs, count, page, limit),
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity logs',
      error: error.message,
    });
  }
});

// =============== DATABASE BACKUP ===============

// Trigger database backup (placeholder - implement based on your hosting)
router.post('/backup', auth, authorize('admin'), async (req, res) => {
  try {
    // This is a placeholder - actual backup depends on hosting/infrastructure
    // You might use mysqldump, cloud provider APIs, etc.

    logActivity(
      req.user.id,
      'DATABASE_BACKUP',
      'System',
      null,
      'Database backup initiated',
      null,
      null,
      req
    );

    res.json({
      success: true,
      message: 'Database backup initiated. You will be notified when complete.',
      data: {
        timestamp: new Date().toISOString(),
        status: 'initiated',
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate backup',
      error: error.message,
    });
  }
});

// =============== SYSTEM STATS ===============

router.get('/system-stats', auth, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await db.User.count();
    const activeUsers = await db.User.count({ where: { isActive: true } });
    const totalStudents = await db.Student.count();
    const activeStudents = await db.Student.count({
      where: { status: 'active' },
    });
    const totalPayments = await db.Payment.count();
    const totalNotifications = await db.Notification.count();

    // Recent activity
    const recentActivity = await db.ActivityLog.findAll({
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        students: { total: totalStudents, active: activeStudents },
        totalPayments,
        totalNotifications,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system stats',
      error: error.message,
    });
  }
});

module.exports = router;
