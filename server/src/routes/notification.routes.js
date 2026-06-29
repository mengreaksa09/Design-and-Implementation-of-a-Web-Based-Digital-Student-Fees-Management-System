const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const { paginate, buildPaginationResponse, getTodayStr } = require('../utils/helpers.util');
const { sendEmail } = require('../utils/email.util');
const db = require('../models');
const { Op } = require('sequelize');

// Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, isRead, type } = req.query;
    const { limit: limitVal, offset } = paginate(page, limit);

    const where = { userId: req.user.id };
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (type) where.type = type;

    const { count, rows: notifications } =
      await db.Notification.findAndCountAll({
        where,
        limit: limitVal,
        offset,
        order: [['createdAt', 'DESC']],
      });

    // Get unread count
    const unreadCount = await db.Notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({
      success: true,
      ...buildPaginationResponse(notifications, count, page, limit),
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message,
    });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await db.Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.update({ isRead: true, readAt: new Date() });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message,
    });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await db.Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.user.id, isRead: false } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
      error: error.message,
    });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await db.Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
});

// Send fee reminder notifications (Admin/Accountant)
router.post(
  '/send-reminders',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const { type, studentIds } = req.body; // type: 'due', 'overdue'

      let where = {
        status: { [Op.in]: ['pending', 'partial'] },
        balanceAmount: { [Op.gt]: 0 },
      };

      const todayStr = getTodayStr();
      if (type === 'overdue') {
        where.dueDate = { [Op.lt]: todayStr };
      } else {
        // Due within 7 days
        const d = new Date();
        d.setDate(d.getDate() + 7);
        const sevenDaysFromNowStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        where.dueDate = { [Op.between]: [todayStr, sevenDaysFromNowStr] };
      }

      if (studentIds && studentIds.length > 0) {
        where.studentId = { [Op.in]: studentIds };
      }

      const assignments = await db.FeeAssignment.findAll({
        where,
        include: [
          {
            model: db.Student,
            as: 'student',
            include: [
              {
                model: db.User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'email'],
              },
            ],
          },
          {
            model: db.FeeStructure,
            as: 'feeStructure',
          },
        ],
      });

      let sentCount = 0;

      for (const assignment of assignments) {
        const student = assignment.student;
        const user = student?.user;

        if (!user?.email) continue;

        const template = type === 'overdue' ? 'overdueWarning' : 'feeReminder';
        const daysOverdue =
          type === 'overdue' && assignment.dueDate
            ? Math.round(
                (new Date(todayStr) - new Date(assignment.dueDate)) /
                  (1000 * 60 * 60 * 24)
              )
            : 0;

        // Create in-app notification
        await db.Notification.create({
          userId: user.id,
          title:
            type === 'overdue' ? 'Overdue Fee Warning' : 'Fee Due Reminder',
          message:
            type === 'overdue'
              ? `Your payment for ${
                  assignment.feeStructure?.name
                } is ${daysOverdue} days overdue. Amount: ${
                  assignment.feeStructure?.currency || 'USD'
                } ${assignment.balanceAmount}`
              : `Your fee payment for ${
                  assignment.feeStructure?.name
                } is due on ${new Date(
                  assignment.dueDate
                ).toLocaleDateString()}. Amount: ${
                  assignment.feeStructure?.currency || 'USD'
                } ${assignment.balanceAmount}`,
          type: type === 'overdue' ? 'overdue_warning' : 'fee_due',
          channel: 'all',
          isSent: true,
          sentAt: new Date(),
          metadata: { feeAssignmentId: assignment.id },
        });

        // Send email
        const emailData =
          type === 'overdue'
            ? {
                studentName: `${user.firstName} ${user.lastName}`,
                feeType: assignment.feeStructure?.name,
                originalAmount: assignment.originalAmount,
                lateFee: assignment.lateFeeApplied,
                totalAmount: assignment.balanceAmount,
                daysOverdue,
                currency: assignment.feeStructure?.currency || 'USD',
              }
            : {
                studentName: `${user.firstName} ${user.lastName}`,
                feeType: assignment.feeStructure?.name,
                amount: assignment.balanceAmount,
                dueDate: new Date(assignment.dueDate).toLocaleDateString(),
                currency: assignment.feeStructure?.currency || 'USD',
              };

        await sendEmail(user.email, template, emailData);
        sentCount++;
      }

      res.json({
        success: true,
        message: `Sent ${sentCount} reminder notifications`,
        data: { sent: sentCount },
      });
    } catch (error) {
      console.error('Send reminders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send reminders',
        error: error.message,
      });
    }
  }
);

// Send custom announcement (Admin only)
router.post('/announcement', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      message,
      sendEmail: shouldSendEmail,
      targetRoles,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
    }

    const userWhere = { isActive: true };
    if (targetRoles && targetRoles.length > 0) {
      userWhere.role = { [Op.in]: targetRoles };
    }

    const users = await db.User.findAll({ where: userWhere });

    const notifications = users.map((user) => ({
      userId: user.id,
      title,
      message,
      type: 'announcement',
      channel: shouldSendEmail ? 'all' : 'in_app',
      isSent: true,
      sentAt: new Date(),
    }));

    await db.Notification.bulkCreate(notifications);

    // Send emails if requested
    if (shouldSendEmail) {
      for (const user of users) {
        // Simple announcement email
        await sendEmail(user.email, 'welcomeEmail', {
          name: `${user.firstName} ${user.lastName}`,
          email: title,
          role: message,
        });
      }
    }

    res.json({
      success: true,
      message: `Announcement sent to ${users.length} users`,
    });
  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send announcement',
      error: error.message,
    });
  }
});

module.exports = router;
