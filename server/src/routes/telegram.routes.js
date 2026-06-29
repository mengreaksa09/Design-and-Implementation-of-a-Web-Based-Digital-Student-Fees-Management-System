const express = require('express');
const router = express.Router();
const { Student, User } = require('../models');
const {
  sendFeeAlert,
  sendPaymentConfirmation,
  sendDueDateReminder,
} = require('../services/telegram.service');
const { auth } = require('../middleware/auth.middleware');

// Send fee alert to student via Telegram
router.post('/send-alert', auth, async (req, res) => {
  try {
    const { studentId, message } = req.body;

    if (!studentId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and message are required',
      });
    }

    const result = await sendFeeAlert(studentId, message);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to send alert',
      });
    }

    res.json({
      success: true,
      message: 'Alert sent successfully',
    });
  } catch (error) {
    console.error('Error sending Telegram alert:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Send payment confirmation to student via Telegram
router.post('/send-payment-confirmation', auth, async (req, res) => {
  try {
    const { studentId, paymentDetails } = req.body;

    if (!studentId || !paymentDetails) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and payment details are required',
      });
    }

    const result = await sendPaymentConfirmation(studentId, paymentDetails);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to send confirmation',
      });
    }

    res.json({
      success: true,
      message: 'Payment confirmation sent successfully',
    });
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Send due date reminder to student via Telegram
router.post('/send-due-reminder', auth, async (req, res) => {
  try {
    const { studentId, feeDetails } = req.body;

    if (!studentId || !feeDetails) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and fee details are required',
      });
    }

    const result = await sendDueDateReminder(studentId, feeDetails);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to send reminder',
      });
    }

    res.json({
      success: true,
      message: 'Reminder sent successfully',
    });
  } catch (error) {
    console.error('Error sending due date reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Bulk send alerts to multiple students
router.post('/send-bulk-alerts', auth, async (req, res) => {
  try {
    const { studentIds, message } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required',
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const results = await Promise.all(
      studentIds.map((studentId) => sendFeeAlert(studentId, message))
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    res.json({
      success: true,
      message: `Alerts sent: ${successCount} successful, ${failCount} failed`,
      details: {
        total: results.length,
        successful: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error('Error sending bulk alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get students with Telegram linked
router.get('/linked-students', auth, async (req, res) => {
  try {
    const students = await Student.findAll({
      where: {
        telegramChatId: { [require('sequelize').Op.ne]: null },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        },
      ],
      attributes: [
        'id',
        'studentId',
        'telegramChatId',
        'telegramUsername',
        'class',
        'department',
        'course',
      ],
    });

    res.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    console.error('Error fetching linked students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Unlink student from Telegram
router.post('/unlink-student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    await student.update({
      telegramChatId: null,
      telegramUsername: null,
    });

    res.json({
      success: true,
      message: 'Student unlinked from Telegram successfully',
    });
  } catch (error) {
    console.error('Error unlinking student:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;
