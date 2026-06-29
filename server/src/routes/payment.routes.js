const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Stripe = require('stripe');
const validate = require('../middleware/validate.middleware');
const { auth, authorize } = require('../middleware/auth.middleware');
const { logActivity } = require('../middleware/activityLog.middleware');
const {
  paginate,
  buildPaginationResponse,
  generateReceiptNumber,
  generateTransactionId,
} = require('../utils/helpers.util');
const { generateReceipt } = require('../utils/receipt.util');
const { sendEmail } = require('../utils/email.util');
const { generateExcelReport } = require('../utils/export.util');
const { sendPaymentConfirmation } = require('../services/telegram.service');
const db = require('../models');
const { Op } = require('sequelize');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get all payments
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      studentId,
      status,
      startDate,
      endDate,
      paymentMethod,
    } = req.query;
    const { limit: limitVal, offset } = paginate(page, limit);

    const where = {};

    // For student role, only show their own payments
    if (req.user.role === 'student') {
      const student = await db.Student.findOne({
        where: { userId: req.user.id },
      });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found',
        });
      }
      where.studentId = student.id;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    if (startDate && endDate) {
      where.paymentDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { count, rows: payments } = await db.Payment.findAndCountAll({
      where,
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email'],
            },
          ],
        },
        {
          model: db.FeeAssignment,
          as: 'feeAssignment',
          include: [
            {
              model: db.FeeStructure,
              as: 'feeStructure',
            },
          ],
        },
        {
          model: db.Transaction,
          as: 'transaction',
        },
      ],
      limit: limitVal,
      offset,
      order: [['paymentDate', 'DESC']],
    });

    res.json({
      success: true,
      ...buildPaginationResponse(payments, count, page, limit),
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
      error: error.message,
    });
  }
});

// Export payments to Excel
router.get(
  '/export',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const { startDate, endDate, status, paymentMethod } = req.query;

      const where = {};
      if (status) where.status = status;
      if (paymentMethod) where.paymentMethod = paymentMethod;

      if (startDate && endDate) {
        where.paymentDate = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const payments = await db.Payment.findAll({
        where,
        include: [
          {
            model: db.Student,
            as: 'student',
            include: [
              {
                model: db.User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'email'],
              },
            ],
          },
          {
            model: db.FeeAssignment,
            as: 'feeAssignment',
            include: [
              {
                model: db.FeeStructure,
                as: 'feeStructure',
                attributes: ['name', 'feeType'],
              },
            ],
          },
        ],
        order: [['paymentDate', 'DESC']],
      });

      // Format data for export
      const exportData = payments.map((payment) => ({
        date: new Date(payment.paymentDate).toLocaleDateString(),
        receiptNumber: payment.receiptNumber,
        studentId: payment.student?.studentId || 'N/A',
        studentName: payment.student?.user
          ? `${payment.student.user.firstName} ${payment.student.user.lastName}`
          : 'N/A',
        feeType: payment.feeAssignment?.feeStructure?.name || 'N/A',
        amount: `${payment.currency} ${payment.amount.toFixed(2)}`,
        paymentMethod: payment.paymentMethod.toUpperCase(),
        status: payment.status.toUpperCase(),
      }));

      const result = await generateExcelReport(exportData, 'Payment Records', {
        startDate: startDate || 'All time',
        endDate: endDate || new Date().toLocaleDateString(),
      });

      // Read the file and send as buffer
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(result.fullPath);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=payments-${
          new Date().toISOString().split('T')[0]
        }.xlsx`
      );

      res.send(fileBuffer);

      // Clean up the file after sending
      fs.unlinkSync(result.fullPath);
    } catch (error) {
      console.error('Export payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export payments',
        error: error.message,
      });
    }
  }
);

// Get payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await db.Payment.findByPk(req.params.id, {
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email'],
            },
          ],
        },
        {
          model: db.FeeAssignment,
          as: 'feeAssignment',
          include: [
            {
              model: db.FeeStructure,
              as: 'feeStructure',
            },
          ],
        },
        {
          model: db.Transaction,
          as: 'transaction',
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check access for student role
    if (req.user.role === 'student') {
      const student = await db.Student.findOne({
        where: { userId: req.user.id },
      });
      if (!student || student.id !== payment.studentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment',
      error: error.message,
    });
  }
});

// Create manual payment (cash/cheque/bank transfer)
router.post(
  '/manual',
  auth,
  authorize('admin', 'accountant'),
  [
    body('feeAssignmentId')
      .notEmpty()
      .withMessage('Fee assignment is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('paymentMethod')
      .isIn(['cash', 'cheque', 'bank_transfer'])
      .withMessage('Invalid payment method'),
  ],
  validate,
  async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      const { feeAssignmentId, amount, paymentMethod, notes } = req.body;

      const feeAssignment = await db.FeeAssignment.findByPk(feeAssignmentId, {
        include: [
          {
            model: db.Student,
            as: 'student',
            include: [{ model: db.User, as: 'user' }],
          },
          {
            model: db.FeeStructure,
            as: 'feeStructure',
          },
        ],
      });

      if (!feeAssignment) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Fee assignment not found',
        });
      }

      if (feeAssignment.status === 'paid') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'This fee has already been fully paid',
        });
      }

      const paymentAmount = parseFloat(amount);
      if (paymentAmount > parseFloat(feeAssignment.balanceAmount)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Amount exceeds balance. Maximum payable: ${feeAssignment.balanceAmount}`,
        });
      }

      const receiptNumber = generateReceiptNumber();
      const transactionId = generateTransactionId();

      // Determine payment status based on payment method
      // Cash payments are auto-approved, others need review
      const paymentStatus = paymentMethod === 'cash' ? 'completed' : 'pending';
      const transactionStatus =
        paymentMethod === 'cash' ? 'completed' : 'pending';

      // Create payment
      const payment = await db.Payment.create(
        {
          studentId: feeAssignment.studentId,
          feeAssignmentId,
          amount: paymentAmount,
          currency: feeAssignment.feeStructure?.currency || 'USD',
          paymentMethod,
          paymentDate: new Date(),
          receiptNumber,
          status: paymentStatus,
          processedBy: req.user.id,
          notes,
        },
        { transaction }
      );

      // Create transaction record
      await db.Transaction.create(
        {
          paymentId: payment.id,
          transactionId,
          status: transactionStatus,
        },
        { transaction }
      );

      // Only update fee assignment if payment is completed (cash)
      // For pending payments, update after approval
      if (paymentStatus === 'completed') {
        const newPaidAmount =
          parseFloat(feeAssignment.paidAmount) + paymentAmount;
        const newBalance =
          parseFloat(feeAssignment.totalAmount) - newPaidAmount;
        const newStatus = newBalance <= 0 ? 'paid' : 'partial';

        await feeAssignment.update(
          {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            status: newStatus,
          },
          { transaction }
        );
      }

      // Generate receipt PDF
      const receiptData = {
        receiptNumber,
        studentId: feeAssignment.student.id,
        studentIdNumber: feeAssignment.student.studentId,
        studentName: `${feeAssignment.student.user.firstName} ${feeAssignment.student.user.lastName}`,
        class: feeAssignment.student.class,
        department: feeAssignment.student.department,
        academicYear: feeAssignment.academicYear,
        feeType: feeAssignment.feeStructure?.feeType,
        feeDescription: feeAssignment.feeStructure?.name,
        amount: paymentAmount,
        currency: feeAssignment.feeStructure?.currency || 'USD',
        paymentDate: new Date().toLocaleDateString(),
        paymentMethod,
        transactionId,
        status: 'completed',
      };

      const receiptResult = await generateReceipt(receiptData);

      await payment.update(
        {
          receiptPath: receiptResult.fullPath,
          qrCode: receiptResult.qrCode,
        },
        { transaction }
      );

      await transaction.commit();

      // Send email notification
      sendEmail(feeAssignment.student.user.email, 'paymentConfirmation', {
        studentName: `${feeAssignment.student.user.firstName} ${feeAssignment.student.user.lastName}`,
        receiptNumber,
        amount: paymentAmount,
        currency: feeAssignment.feeStructure?.currency || 'USD',
        feeType: feeAssignment.feeStructure?.name,
        paymentDate: new Date().toLocaleDateString(),
        paymentMethod,
      });

      // Send Telegram notification
      sendPaymentConfirmation(feeAssignment.studentId, {
        amount: paymentAmount,
        receiptNumber,
        paymentDate: new Date(),
        paymentMethod,
      }).catch((err) =>
        console.error('Failed to send Telegram notification:', err)
      );

      // Create notification
      await db.Notification.create({
        userId: feeAssignment.student.userId,
        title: 'Payment Received',
        message: `Your payment of ${
          feeAssignment.feeStructure?.currency || 'USD'
        } ${paymentAmount} for ${
          feeAssignment.feeStructure?.name
        } has been received. Receipt: ${receiptNumber}`,
        type: 'payment_received',
        channel: 'all',
        isSent: true,
        sentAt: new Date(),
      });

      logActivity(
        req.user.id,
        'CREATE_PAYMENT',
        'Payment',
        payment.id,
        `Manual payment: ${receiptNumber}`,
        null,
        null,
        req
      );

      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: {
          payment,
          receiptPath: receiptResult.fullPath,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Create manual payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record payment',
        error: error.message,
      });
    }
  }
);

// Create Stripe payment intent
router.post(
  '/create-payment-intent',
  auth,
  [
    body('feeAssignmentId')
      .notEmpty()
      .withMessage('Fee assignment is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
  ],
  validate,
  async (req, res) => {
    try {
      const { feeAssignmentId, amount } = req.body;

      const feeAssignment = await db.FeeAssignment.findByPk(feeAssignmentId, {
        include: [
          {
            model: db.Student,
            as: 'student',
            include: [{ model: db.User, as: 'user' }],
          },
          {
            model: db.FeeStructure,
            as: 'feeStructure',
          },
        ],
      });

      if (!feeAssignment) {
        return res.status(404).json({
          success: false,
          message: 'Fee assignment not found',
        });
      }

      // Verify student ownership for student role
      if (req.user.role === 'student') {
        const student = await db.Student.findOne({
          where: { userId: req.user.id },
        });
        if (!student || student.id !== feeAssignment.studentId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied',
          });
        }
      }

      const paymentAmount = parseFloat(amount);
      if (paymentAmount > parseFloat(feeAssignment.balanceAmount)) {
        return res.status(400).json({
          success: false,
          message: `Amount exceeds balance. Maximum payable: ${feeAssignment.balanceAmount}`,
        });
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentAmount * 100), // Convert to cents
        currency: (feeAssignment.feeStructure?.currency || 'usd').toLowerCase(),
        metadata: {
          feeAssignmentId,
          studentId: feeAssignment.studentId,
          feeType: feeAssignment.feeStructure?.feeType,
        },
      });

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      });
    } catch (error) {
      console.error('Create payment intent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment intent',
        error: error.message,
      });
    }
  }
);

// Confirm Stripe payment
router.post(
  '/confirm-payment',
  auth,
  [
    body('paymentIntentId')
      .notEmpty()
      .withMessage('Payment intent ID is required'),
    body('feeAssignmentId')
      .notEmpty()
      .withMessage('Fee assignment is required'),
  ],
  validate,
  async (req, res) => {
    const dbTransaction = await db.sequelize.transaction();

    try {
      const { paymentIntentId, feeAssignmentId } = req.body;

      // Verify payment with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status !== 'succeeded') {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Payment not completed',
        });
      }

      const feeAssignment = await db.FeeAssignment.findByPk(feeAssignmentId, {
        include: [
          {
            model: db.Student,
            as: 'student',
            include: [{ model: db.User, as: 'user' }],
          },
          {
            model: db.FeeStructure,
            as: 'feeStructure',
          },
        ],
      });

      if (!feeAssignment) {
        await dbTransaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Fee assignment not found',
        });
      }

      const paymentAmount = paymentIntent.amount / 100; // Convert from cents
      const receiptNumber = generateReceiptNumber();
      const transactionId = generateTransactionId();

      // Create payment
      const payment = await db.Payment.create(
        {
          studentId: feeAssignment.studentId,
          feeAssignmentId,
          amount: paymentAmount,
          currency: paymentIntent.currency.toUpperCase(),
          paymentMethod: 'online',
          paymentDate: new Date(),
          receiptNumber,
          status: 'completed',
        },
        { transaction: dbTransaction }
      );

      // Create transaction record
      await db.Transaction.create(
        {
          paymentId: payment.id,
          transactionId,
          stripePaymentIntentId: paymentIntentId,
          stripeChargeId: paymentIntent.latest_charge,
          gatewayResponse: paymentIntent,
          status: 'completed',
        },
        { transaction: dbTransaction }
      );

      // Update fee assignment
      const newPaidAmount =
        parseFloat(feeAssignment.paidAmount) + paymentAmount;
      const newBalance = parseFloat(feeAssignment.totalAmount) - newPaidAmount;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      await feeAssignment.update(
        {
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          status: newStatus,
        },
        { transaction: dbTransaction }
      );

      // Generate receipt
      const receiptData = {
        receiptNumber,
        studentId: feeAssignment.student.id,
        studentIdNumber: feeAssignment.student.studentId,
        studentName: `${feeAssignment.student.user.firstName} ${feeAssignment.student.user.lastName}`,
        class: feeAssignment.student.class,
        department: feeAssignment.student.department,
        academicYear: feeAssignment.academicYear,
        feeType: feeAssignment.feeStructure?.feeType,
        feeDescription: feeAssignment.feeStructure?.name,
        amount: paymentAmount,
        currency: paymentIntent.currency.toUpperCase(),
        paymentDate: new Date().toLocaleDateString(),
        paymentMethod: 'Online (Card)',
        transactionId,
        status: 'completed',
      };

      const receiptResult = await generateReceipt(receiptData);

      await payment.update(
        {
          receiptPath: receiptResult.fullPath,
          qrCode: receiptResult.qrCode,
        },
        { transaction: dbTransaction }
      );

      await dbTransaction.commit();

      // Send email notification
      sendEmail(feeAssignment.student.user.email, 'paymentConfirmation', {
        studentName: `${feeAssignment.student.user.firstName} ${feeAssignment.student.user.lastName}`,
        receiptNumber,
        amount: paymentAmount,
        currency: paymentIntent.currency.toUpperCase(),
        feeType: feeAssignment.feeStructure?.name,
        paymentDate: new Date().toLocaleDateString(),
        paymentMethod: 'Online (Card)',
      });

      // Create notification
      await db.Notification.create({
        userId: feeAssignment.student.userId,
        title: 'Payment Successful',
        message: `Your online payment of ${paymentIntent.currency.toUpperCase()} ${paymentAmount} has been processed successfully. Receipt: ${receiptNumber}`,
        type: 'payment_received',
        channel: 'all',
        isSent: true,
        sentAt: new Date(),
      });

      logActivity(
        req.user.id,
        'ONLINE_PAYMENT',
        'Payment',
        payment.id,
        `Online payment: ${receiptNumber}`,
        null,
        null,
        req
      );

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          payment,
          receiptPath: receiptResult.fullPath,
        },
      });
    } catch (error) {
      await dbTransaction.rollback();
      console.error('Confirm payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm payment',
        error: error.message,
      });
    }
  }
);

// Download receipt
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    const payment = await db.Payment.findByPk(req.params.id, {
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email'],
            },
          ],
        },
        {
          model: db.FeeAssignment,
          as: 'feeAssignment',
          include: [
            {
              model: db.FeeStructure,
              as: 'feeStructure',
            },
          ],
        },
        {
          model: db.Transaction,
          as: 'transaction',
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check access for student role
    if (req.user.role === 'student') {
      const student = await db.Student.findOne({
        where: { userId: req.user.id },
      });
      if (!student || student.id !== payment.studentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    // Generate/Regenerate receipt PDF on the fly using latest styles and layout coordinates
    const receiptData = {
      receiptNumber: payment.receiptNumber,
      studentId: payment.student?.id,
      studentIdNumber: payment.student?.studentId,
      studentName: `${payment.student?.user?.firstName || ''} ${payment.student?.user?.lastName || ''}`.trim() || 'N/A',
      class: payment.student?.class || 'N/A',
      department: payment.student?.department || 'N/A',
      academicYear: payment.feeAssignment?.academicYear || 'N/A',
      feeType: payment.feeAssignment?.feeStructure?.feeType || 'N/A',
      feeDescription: payment.feeAssignment?.feeStructure?.name || 'Fee Payment',
      amount: parseFloat(payment.amount),
      currency: payment.currency || 'USD',
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transaction?.transactionId,
      status: payment.status || 'completed',
    };

    const receiptResult = await generateReceipt(receiptData);
    const filePath = receiptResult.fullPath;

    // Update receipt path in database if it wasn't set or changed
    if (payment.receiptPath !== receiptResult.fullPath) {
      await payment.update({
        receiptPath: receiptResult.fullPath,
        qrCode: receiptResult.qrCode,
      });
    }

    // Set headers for PDF download
    const fs = require('fs');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="receipt-${payment.receiptNumber}.pdf"`
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error('Error streaming receipt file:', error);
      res.status(500).json({
        success: false,
        message: 'Error reading receipt file',
      });
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get receipt',
      error: error.message,
    });
  }
});

// Get payment statistics
router.get(
  '/stats/summary',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.paymentDate = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      // Total collection
      const totalCollection =
        (await db.Payment.sum('amount', {
          where: { ...dateFilter, status: 'completed' },
        })) || 0;

      // Today's collection
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todayCollection =
        (await db.Payment.sum('amount', {
          where: {
            status: 'completed',
            paymentDate: { [Op.between]: [today, todayEnd] },
          },
        })) || 0;

      // Payment count
      const paymentCount = await db.Payment.count({
        where: { ...dateFilter, status: 'completed' },
      });

      // By payment method
      const byPaymentMethod = await db.Payment.findAll({
        where: { ...dateFilter, status: 'completed' },
        attributes: [
          'paymentMethod',
          [db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 'total'],
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
        ],
        group: ['paymentMethod'],
      });

      res.json({
        success: true,
        data: {
          totalCollection,
          todayCollection,
          paymentCount,
          byPaymentMethod,
        },
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment statistics',
        error: error.message,
      });
    }
  }
);

// Approve payment
router.put(
  '/:id/approve',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      const payment = await db.Payment.findByPk(req.params.id, {
        include: [
          {
            model: db.FeeAssignment,
            as: 'feeAssignment',
            include: [
              {
                model: db.FeeStructure,
                as: 'feeStructure',
              },
            ],
          },
        ],
      });

      if (!payment) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      if (payment.status !== 'pending') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Only pending payments can be approved',
        });
      }

      // Update payment status
      await payment.update(
        {
          status: 'completed',
          processedBy: req.user.id,
        },
        { transaction }
      );

      // Update transaction status
      await db.Transaction.update(
        { status: 'completed' },
        {
          where: { paymentId: payment.id },
          transaction,
        }
      );

      // Update fee assignment
      const feeAssignment = payment.feeAssignment;
      const paymentAmount = parseFloat(payment.amount);
      const newPaidAmount =
        parseFloat(feeAssignment.paidAmount) + paymentAmount;
      const newBalance = parseFloat(feeAssignment.totalAmount) - newPaidAmount;
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      await feeAssignment.update(
        {
          paidAmount: newPaidAmount,
          balanceAmount: newBalance,
          status: newStatus,
        },
        { transaction }
      );

      await transaction.commit();

      // Log activity
      await logActivity(req, {
        action: 'approve_payment',
        entityType: 'payment',
        entityId: payment.id,
        details: `Approved payment ${payment.receiptNumber}`,
      });

      res.json({
        success: true,
        message: 'Payment approved successfully',
        data: payment,
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Approve payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve payment',
        error: error.message,
      });
    }
  }
);

// Reject payment
router.put(
  '/:id/reject',
  auth,
  authorize('admin', 'accountant'),
  [body('reason').notEmpty().withMessage('Rejection reason is required')],
  validate,
  async (req, res) => {
    const transaction = await db.sequelize.transaction();

    try {
      const { reason } = req.body;

      const payment = await db.Payment.findByPk(req.params.id);

      if (!payment) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      if (payment.status !== 'pending') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Only pending payments can be rejected',
        });
      }

      // Update payment status
      await payment.update(
        {
          status: 'failed',
          notes: `Rejected: ${reason}`,
          processedBy: req.user.id,
        },
        { transaction }
      );

      // Update transaction status
      await db.Transaction.update(
        {
          status: 'failed',
          failureReason: reason,
        },
        {
          where: { paymentId: payment.id },
          transaction,
        }
      );

      await transaction.commit();

      // Log activity
      await logActivity(req, {
        action: 'reject_payment',
        entityType: 'payment',
        entityId: payment.id,
        details: `Rejected payment ${payment.receiptNumber}: ${reason}`,
      });

      res.json({
        success: true,
        message: 'Payment rejected successfully',
        data: payment,
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Reject payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject payment',
        error: error.message,
      });
    }
  }
);

module.exports = router;
