const express = require('express');
const router = express.Router();
const path = require('path');
const { auth, authorize } = require('../middleware/auth.middleware');
const {
  generateExcelReport,
  generatePdfReport,
} = require('../utils/export.util');
const { parseDateRange, getTodayStr } = require('../utils/helpers.util');
const db = require('../models');
const { Op } = require('sequelize');

// Helper to handle file export downloads directly
const handleExport = async (req, res, reportType, payments, options) => {
  const { format } = req.query;
  const data = payments.map((p) => ({
    date: new Date(p.paymentDate).toLocaleDateString(),
    receiptNumber: p.receiptNumber || 'N/A',
    studentId: p.student?.studentId || 'N/A',
    studentName: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : 'N/A',
    feeType: p.feeAssignment?.feeStructure?.name || 'N/A',
    amount: parseFloat(p.amount || 0).toFixed(2),
    paymentMethod: p.paymentMethod === 'cash' ? 'សាច់ប្រាក់' : p.paymentMethod === 'bank_transfer' ? 'ផ្ទេរតាមធនាគារ' : p.paymentMethod,
    status: p.status === 'completed' ? 'បានបញ្ចប់' : p.status,
  }));

  try {
    let result;
    if (format === 'excel') {
      result = await generateExcelReport(data, reportType, options);
    } else {
      result = await generatePdfReport(data, reportType, options);
    }

    res.sendFile(result.fullPath);
  } catch (error) {
    console.error('Export handling error:', error);
    res.status(500).json({ success: false, message: 'Failed to export report file' });
  }
};

// GET /api/reports/dashboard
router.get(
  '/dashboard',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const { dateFilter = 'month' } = req.query;

      // Calculate date range based on filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let startDate, endDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(today);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          // Get start of week (Sunday)
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        default:
          // Default to month
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );
      }

      // Total students (not filtered by date)
      const totalStudents = await db.Student.count({
        where: { status: 'active' },
      });

      // Total fees collected (filtered by date range)
      const totalCollected =
        (await db.Payment.sum('amount', {
          where: {
            status: 'completed',
            paymentDate: { [Op.between]: [startDate, endDate] },
          },
        })) || 0;

      // Pending fees (not filtered by date - shows all pending)
      const pendingFees =
        (await db.FeeAssignment.sum('balanceAmount', {
          where: { status: { [Op.in]: ['pending', 'partial'] } },
        })) || 0;

      // Overdue fees (not filtered by date - shows all overdue)
      const overdueFees =
        (await db.FeeAssignment.sum('balanceAmount', {
          where: {
            status: { [Op.in]: ['pending', 'partial', 'overdue'] },
            dueDate: { [Op.lt]: getTodayStr() },
          },
        })) || 0;

      // Today's collection
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      const todayCollection =
        (await db.Payment.sum('amount', {
          where: {
            status: 'completed',
            paymentDate: { [Op.between]: [todayStart, todayEnd] },
          },
        })) || 0;

      // This month's collection
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      const monthCollection =
        (await db.Payment.sum('amount', {
          where: {
            status: 'completed',
            paymentDate: { [Op.between]: [monthStart, monthEnd] },
          },
        })) || 0;

      // Recent payments (filtered by date range)
      const recentPayments = await db.Payment.findAll({
        where: {
          status: 'completed',
          paymentDate: { [Op.between]: [startDate, endDate] },
        },
        include: [
          {
            model: db.Student,
            as: 'student',
            include: [
              {
                model: db.User,
                as: 'user',
                attributes: ['firstName', 'lastName'],
              },
            ],
          },
        ],
        order: [['paymentDate', 'DESC']],
        limit: 5,
      });

      // Fee collection by type (filtered by date range)
      const collectionByType = await db.Payment.findAll({
        where: {
          status: 'completed',
          paymentDate: { [Op.between]: [startDate, endDate] },
        },
        include: [
          {
            model: db.FeeAssignment,
            as: 'feeAssignment',
            include: [
              {
                model: db.FeeStructure,
                as: 'feeStructure',
                attributes: ['feeType', 'name'],
              },
            ],
          },
        ],
        attributes: [
          [db.Sequelize.fn('SUM', db.Sequelize.col('Payment.amount')), 'total'],
        ],
        group: ['feeAssignment.feeStructure.feeType'],
        raw: true,
      });

      // Format fee breakdown
      const feeBreakdown = collectionByType.map((item) => ({
        name: item['feeAssignment.feeStructure.feeType'] || 'Other',
        amount: parseFloat(item.total || 0),
      }));

      // Monthly collections (last 12 months)
      const monthlyCollections = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEndDate = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        const monthTotal =
          (await db.Payment.sum('amount', {
            where: {
              status: 'completed',
              paymentDate: { [Op.between]: [monthDate, monthEndDate] },
            },
          })) || 0;
        monthlyCollections.push(monthTotal);
      }

      // Payment methods breakdown (filtered by date range)
      const paymentMethods = await db.Payment.findAll({
        where: {
          status: 'completed',
          paymentDate: { [Op.between]: [startDate, endDate] },
        },
        attributes: [
          'paymentMethod',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
        ],
        group: ['paymentMethod'],
        raw: true,
      });

      const paymentMethodsData = {
        online: 0,
        cash: 0,
        bank_transfer: 0,
        cheque: 0,
      };

      paymentMethods.forEach((pm) => {
        if (pm.paymentMethod && paymentMethodsData.hasOwnProperty(pm.paymentMethod)) {
          paymentMethodsData[pm.paymentMethod] = parseInt(pm.count);
        }
      });

      // Collection rate calculation
      const totalFees = totalCollected + pendingFees;
      const collectionRate = totalFees > 0 ? ((totalCollected / totalFees) * 100).toFixed(1) : 0;

      // Count overdue payments
      const overduePayments = await db.FeeAssignment.count({
        where: {
          status: { [Op.in]: ['pending', 'partial', 'overdue'] },
          dueDate: { [Op.lt]: getTodayStr() },
        },
      });

      // Count pending approvals (manual payments)
      const pendingApprovals = await db.Payment.count({
        where: {
          status: 'pending',
          paymentMethod: { [Op.in]: ['cash', 'cheque', 'bank_transfer'] },
        },
      });

      res.json({
        success: true,
        data: {
          dateFilter,
          dateRange: {
            start: startDate,
            end: endDate,
          },
          totalStudents,
          totalCollected,
          pendingFees,
          overdueFees,
          todayCollection,
          monthCollection,
          collectionRate,
          recentPayments,
          collectionByType,
          feeBreakdown,
          monthlyCollections,
          paymentMethods: [
            paymentMethodsData.online,
            paymentMethodsData.cash,
            paymentMethodsData.bank_transfer,
            paymentMethodsData.cheque,
          ],
          overduePayments,
          pendingApprovals,
        },
      });
    } catch (error) {
      console.error('Dashboard report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data',
        error: error.message,
      });
    }
  }
);

// GET /api/reports/daily
router.get('/daily', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);

    const payments = await db.Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: { [Op.between]: [reportDate, endDate] },
      },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['firstName', 'lastName'],
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
      ],
      order: [['paymentDate', 'DESC']],
    });

    const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const transactionCount = payments.length;
    const uniqueStudents = new Set(payments.map(p => p.studentId).filter(Boolean));
    const studentsPaid = uniqueStudents.size;
    const averagePayment = transactionCount > 0 ? (totalCollected / transactionCount) : 0;

    const transactions = payments.map((p) => ({
      date: p.paymentDate,
      studentName: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : 'N/A',
      feeType: p.feeAssignment?.feeStructure?.name || 'N/A',
      method: p.paymentMethod,
      amount: parseFloat(p.amount || 0),
    }));

    res.json({
      success: true,
      data: {
        totalCollected,
        transactionCount,
        studentsPaid,
        averagePayment,
        transactions,
      },
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate daily report' });
  }
});

// GET /api/reports/monthly
router.get('/monthly', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const reportYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(reportYear, reportMonth, 1);
    const endDate = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);

    const payments = await db.Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: { [Op.between]: [startDate, endDate] },
      },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['firstName', 'lastName'],
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
      ],
      order: [['paymentDate', 'DESC']],
    });

    const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const transactionCount = payments.length;
    const uniqueStudents = new Set(payments.map(p => p.studentId).filter(Boolean));
    const studentsPaid = uniqueStudents.size;
    const averagePayment = transactionCount > 0 ? (totalCollected / transactionCount) : 0;

    const transactions = payments.map((p) => ({
      date: p.paymentDate,
      studentName: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : 'N/A',
      feeType: p.feeAssignment?.feeStructure?.name || 'N/A',
      method: p.paymentMethod,
      amount: parseFloat(p.amount || 0),
    }));

    // Group by day for the chart
    const dailyMap = {};
    payments.forEach((p) => {
      const day = new Date(p.paymentDate).getDate();
      dailyMap[day] = (dailyMap[day] || 0) + parseFloat(p.amount || 0);
    });

    const chartLabels = [];
    const chartData = [];
    const daysInMonth = new Date(reportYear, reportMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      chartLabels.push(`ថ្ងៃទី ${day}`);
      chartData.push(dailyMap[day] || 0);
    }

    res.json({
      success: true,
      data: {
        totalCollected,
        transactionCount,
        studentsPaid,
        averagePayment,
        chartLabels,
        chartData,
        transactions,
      },
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate monthly report' });
  }
});

// GET /api/reports/yearly
router.get('/yearly', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { year } = req.query;
    const reportYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(reportYear, 0, 1);
    const endDate = new Date(reportYear, 11, 31, 23, 59, 59, 999);

    const payments = await db.Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: { [Op.between]: [startDate, endDate] },
      },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['firstName', 'lastName'],
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
      ],
      order: [['paymentDate', 'DESC']],
    });

    const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const transactionCount = payments.length;
    const uniqueStudents = new Set(payments.map(p => p.studentId).filter(Boolean));
    const studentsPaid = uniqueStudents.size;
    const averagePayment = transactionCount > 0 ? (totalCollected / transactionCount) : 0;

    const transactions = payments.map((p) => ({
      date: p.paymentDate,
      studentName: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : 'N/A',
      feeType: p.feeAssignment?.feeStructure?.name || 'N/A',
      method: p.paymentMethod,
      amount: parseFloat(p.amount || 0),
    }));

    // Group by month for the chart
    const monthlyMap = {};
    payments.forEach((p) => {
      const monthIndex = new Date(p.paymentDate).getMonth();
      monthlyMap[monthIndex] = (monthlyMap[monthIndex] || 0) + parseFloat(p.amount || 0);
    });

    const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
    const chartLabels = khmerMonths;
    const chartData = khmerMonths.map((_, index) => monthlyMap[index] || 0);

    res.json({
      success: true,
      data: {
        totalCollected,
        transactionCount,
        studentsPaid,
        averagePayment,
        chartLabels,
        chartData,
        transactions,
      },
    });
  } catch (error) {
    console.error('Yearly report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate yearly report' });
  }
});

// GET /api/reports/collection
router.get('/collection', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const reportStartDate = startDate ? new Date(startDate) : new Date();
    reportStartDate.setHours(0, 0, 0, 0);
    const reportEndDate = endDate ? new Date(endDate) : new Date();
    reportEndDate.setHours(23, 59, 59, 999);

    const payments = await db.Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: { [Op.between]: [reportStartDate, reportEndDate] },
      },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['firstName', 'lastName'],
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
      ],
      order: [['paymentDate', 'DESC']],
    });

    const totalCollected = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const transactionCount = payments.length;
    const uniqueStudents = new Set(payments.map(p => p.studentId).filter(Boolean));
    const studentsPaid = uniqueStudents.size;
    const averagePayment = transactionCount > 0 ? (totalCollected / transactionCount) : 0;

    const transactions = payments.map((p) => ({
      date: p.paymentDate,
      studentName: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : 'N/A',
      feeType: p.feeAssignment?.feeStructure?.name || 'N/A',
      method: p.paymentMethod,
      amount: parseFloat(p.amount || 0),
    }));

    // Group by day for the chart
    const dailyMap = {};
    payments.forEach((p) => {
      const dateString = new Date(p.paymentDate).toISOString().split('T')[0];
      dailyMap[dateString] = (dailyMap[dateString] || 0) + parseFloat(p.amount || 0);
    });

    const chartLabels = [];
    const chartData = [];
    const curr = new Date(reportStartDate);
    const end = new Date(reportEndDate);
    while (curr <= end) {
      const dateString = curr.toISOString().split('T')[0];
      const d = curr.getDate();
      const m = curr.getMonth() + 1;
      chartLabels.push(`${d}/${m}`);
      chartData.push(dailyMap[dateString] || 0);
      curr.setDate(curr.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        totalCollected,
        transactionCount,
        studentsPaid,
        averagePayment,
        chartLabels,
        chartData,
        transactions,
      },
    });
  } catch (error) {
    console.error('Collection report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate collection report' });
  }
});

// GET /api/reports/daily/export
router.get('/daily/export', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);

    const payments = await db.Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: { [Op.between]: [reportDate, endDate] },
      },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            { model: db.User, as: 'user', attributes: ['firstName', 'lastName'] },
          ],
        },
        {
          model: db.FeeAssignment,
          as: 'feeAssignment',
          include: [{ model: db.FeeStructure, as: 'feeStructure' }],
        },
      ],
      order: [['paymentDate', 'DESC']],
    });

    await handleExport(req, res, 'Daily Collection', payments, {
      startDate: reportDate.toLocaleDateString(),
      endDate: reportDate.toLocaleDateString(),
    });
  } catch (error) {
    console.error('Daily export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export daily report' });
  }
});

// GET /api/reports/monthly/export
router.get('/monthly/export', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const reportMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const reportYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(reportYear, reportMonth, 1);
    const endDate = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);

    const payments = await db.Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: { [Op.between]: [startDate, endDate] },
      },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            { model: db.User, as: 'user', attributes: ['firstName', 'lastName'] },
          ],
        },
        {
          model: db.FeeAssignment,
          as: 'feeAssignment',
          include: [{ model: db.FeeStructure, as: 'feeStructure' }],
        },
      ],
      order: [['paymentDate', 'DESC']],
    });

    await handleExport(req, res, 'Monthly Collection', payments, {
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
    });
  } catch (error) {
    console.error('Monthly export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export monthly report' });
  }
});

// GET /api/reports/yearly/export
router.get('/yearly/export', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { year } = req.query;
    const reportYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(reportYear, 0, 1);
    const endDate = new Date(reportYear, 11, 31, 23, 59, 59, 999);

    const payments = await db.Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: { [Op.between]: [startDate, endDate] },
      },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            { model: db.User, as: 'user', attributes: ['firstName', 'lastName'] },
          ],
        },
        {
          model: db.FeeAssignment,
          as: 'feeAssignment',
          include: [{ model: db.FeeStructure, as: 'feeStructure' }],
        },
      ],
      order: [['paymentDate', 'DESC']],
    });

    await handleExport(req, res, 'Yearly Collection', payments, {
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
    });
  } catch (error) {
    console.error('Yearly export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export yearly report' });
  }
});

// GET /api/reports/collection/export
router.get('/collection/export', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const reportStartDate = startDate ? new Date(startDate) : new Date();
    reportStartDate.setHours(0, 0, 0, 0);
    const reportEndDate = endDate ? new Date(endDate) : new Date();
    reportEndDate.setHours(23, 59, 59, 999);

    const payments = await db.Payment.findAll({
      where: {
        status: 'completed',
        paymentDate: { [Op.between]: [reportStartDate, reportEndDate] },
      },
      include: [
        {
          model: db.Student,
          as: 'student',
          include: [
            { model: db.User, as: 'user', attributes: ['firstName', 'lastName'] },
          ],
        },
        {
          model: db.FeeAssignment,
          as: 'feeAssignment',
          include: [{ model: db.FeeStructure, as: 'feeStructure' }],
        },
      ],
      order: [['paymentDate', 'DESC']],
    });

    await handleExport(req, res, 'Period Collection', payments, {
      startDate: reportStartDate.toLocaleDateString(),
      endDate: reportEndDate.toLocaleDateString(),
    });
  } catch (error) {
    console.error('Collection export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export collection report' });
  }
});

// Daily collection report (deprecating or keeping fallback)
router.get(
  '/daily-collection',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const { date } = req.query;
      const reportDate = date ? new Date(date) : new Date();
      reportDate.setHours(0, 0, 0, 0);
      const endDate = new Date(reportDate);
      endDate.setHours(23, 59, 59, 999);

      const payments = await db.Payment.findAll({
        where: {
          status: 'completed',
          paymentDate: { [Op.between]: [reportDate, endDate] },
        },
        include: [
          {
            model: db.Student,
            as: 'student',
            include: [
              {
                model: db.User,
                as: 'user',
                attributes: ['firstName', 'lastName'],
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
        ],
        order: [['paymentDate', 'DESC']],
      });

      const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const reportData = payments.map((p) => ({
        date: p.paymentDate.toLocaleDateString(),
        receiptNumber: p.receiptNumber,
        studentId: p.student?.studentId,
        studentName: `${p.student?.user?.firstName} ${p.student?.user?.lastName}`,
        feeType: p.feeAssignment?.feeStructure?.feeType,
        amount: parseFloat(p.amount),
        paymentMethod: p.paymentMethod,
        status: p.status,
      }));

      res.json({
        success: true,
        data: {
          date: reportDate.toLocaleDateString(),
          payments: reportData,
          total,
          count: payments.length,
        },
      });
    } catch (error) {
      console.error('Daily collection report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate daily report',
        error: error.message,
      });
    }
  }
);

// Monthly collection report (deprecating or keeping fallback)
router.get(
  '/monthly-collection',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const { month, year } = req.query;
      const reportMonth = month ? parseInt(month) - 1 : new Date().getMonth();
      const reportYear = year ? parseInt(year) : new Date().getFullYear();

      const startDate = new Date(reportYear, reportMonth, 1);
      const endDate = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);

      const payments = await db.Payment.findAll({
        where: {
          status: 'completed',
          paymentDate: { [Op.between]: [startDate, endDate] },
        },
        include: [
          {
            model: db.Student,
            as: 'student',
            include: [
              {
                model: db.User,
                as: 'user',
                attributes: ['firstName', 'lastName'],
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
        ],
        order: [['paymentDate', 'DESC']],
      });

      // Group by date
      const dailyTotals = {};
      payments.forEach((p) => {
        const dateKey = p.paymentDate.toLocaleDateString();
        if (!dailyTotals[dateKey]) {
          dailyTotals[dateKey] = { date: dateKey, amount: 0, count: 0 };
        }
        dailyTotals[dateKey].amount += parseFloat(p.amount);
        dailyTotals[dateKey].count++;
      });

      const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      res.json({
        success: true,
        data: {
          month: reportMonth + 1,
          year: reportYear,
          dailyTotals: Object.values(dailyTotals),
          total,
          count: payments.length,
        },
      });
    } catch (error) {
      console.error('Monthly collection report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate monthly report',
        error: error.message,
      });
    }
  }
);

// Class-wise report
router.get(
  '/class-wise',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const { academicYear } = req.query;

      const classData = await db.Student.findAll({
        where: { status: 'active' },
        attributes: [
          'class',
          [
            db.Sequelize.fn('COUNT', db.Sequelize.col('Student.id')),
            'totalStudents',
          ],
        ],
        include: [
          {
            model: db.FeeAssignment,
            as: 'feeAssignments',
            attributes: [],
            where: academicYear ? { academicYear } : {},
            required: false,
          },
        ],
        group: ['class'],
        raw: true,
      });

      // Get fee totals per class
      const report = [];
      for (const classInfo of classData) {
        if (!classInfo.class) continue;

        const students = await db.Student.findAll({
          where: { class: classInfo.class, status: 'active' },
          include: [
            {
              model: db.FeeAssignment,
              as: 'feeAssignments',
              where: academicYear ? { academicYear } : {},
              required: false,
            },
          ],
        });

        let totalFees = 0;
        let collected = 0;

        students.forEach((student) => {
          student.feeAssignments.forEach((fa) => {
            totalFees += parseFloat(fa.totalAmount);
            collected += parseFloat(fa.paidAmount);
          });
        });

        report.push({
          class: classInfo.class,
          totalStudents: parseInt(classInfo.totalStudents),
          totalFees,
          collected,
          pending: totalFees - collected,
          collectionPercentage:
            totalFees > 0 ? ((collected / totalFees) * 100).toFixed(2) : 0,
        });
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Class-wise report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate class-wise report',
        error: error.message,
      });
    }
  }
);

// Department-wise report
router.get(
  '/department-wise',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const { academicYear } = req.query;

      const departments = await db.Student.findAll({
        where: { status: 'active', department: { [Op.ne]: null } },
        attributes: [
          [
            db.Sequelize.fn('DISTINCT', db.Sequelize.col('department')),
            'department',
          ],
        ],
        raw: true,
      });

      const report = [];
      for (const dept of departments) {
        if (!dept.department) continue;

        const students = await db.Student.findAll({
          where: { department: dept.department, status: 'active' },
          include: [
            {
              model: db.FeeAssignment,
              as: 'feeAssignments',
              where: academicYear ? { academicYear } : {},
              required: false,
            },
          ],
        });

        let totalFees = 0;
        let collected = 0;

        students.forEach((student) => {
          student.feeAssignments.forEach((fa) => {
            totalFees += parseFloat(fa.totalAmount);
            collected += parseFloat(fa.paidAmount);
          });
        });

        report.push({
          department: dept.department,
          totalStudents: students.length,
          totalFees,
          collected,
          pending: totalFees - collected,
          collectionPercentage:
            totalFees > 0 ? ((collected / totalFees) * 100).toFixed(2) : 0,
        });
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Department-wise report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate department-wise report',
        error: error.message,
      });
    }
  }
);

// Defaulters report (students with overdue fees)
router.get(
  '/defaulters',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const defaulters = await db.FeeAssignment.findAll({
        where: {
          status: { [Op.in]: ['pending', 'partial', 'overdue'] },
          dueDate: { [Op.lt]: getTodayStr() },
          balanceAmount: { [Op.gt]: 0 },
        },
        include: [
          {
            model: db.Student,
            as: 'student',
            include: [
              {
                model: db.User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'email', 'phone'],
              },
            ],
          },
          {
            model: db.FeeStructure,
            as: 'feeStructure',
          },
        ],
        order: [['dueDate', 'ASC']],
      });

      const report = defaulters.map((d) => {
        let daysOverdue = 0;
        if (d.dueDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const [yr, mo, dy] = d.dueDate.split('-').map(Number);
          const due = new Date(yr, mo - 1, dy);
          daysOverdue = Math.round((today - due) / (1000 * 60 * 60 * 24));
        }
        return {
          studentId: d.student?.studentId,
          studentName: `${d.student?.user?.firstName} ${d.student?.user?.lastName}`,
          email: d.student?.user?.email,
          phone: d.student?.user?.phone,
          class: d.student?.class,
          department: d.student?.department,
          feeType: d.feeStructure?.feeType,
          totalAmount: parseFloat(d.totalAmount),
          paidAmount: parseFloat(d.paidAmount),
          balanceAmount: parseFloat(d.balanceAmount),
          dueDate: d.dueDate,
          daysOverdue,
        };
      });

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Defaulters report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate defaulters report',
        error: error.message,
      });
    }
  }
);

// Export report to Excel
router.post(
  '/export/excel',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const { reportType, data, options } = req.body;

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          message: 'Report data is required',
        });
      }

      const result = await generateExcelReport(data, reportType, options);

      res.json({
        success: true,
        message: 'Excel report generated successfully',
        data: {
          filePath: result.filePath,
        },
      });
    } catch (error) {
      console.error('Export Excel error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report',
        error: error.message,
      });
    }
  }
);

// Export report to PDF
router.post(
  '/export/pdf',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const { reportType, data, options } = req.body;

      if (!data || !Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          message: 'Report data is required',
        });
      }

      const result = await generatePdfReport(data, reportType, options);

      res.json({
        success: true,
        message: 'PDF report generated successfully',
        data: {
          filePath: result.filePath,
        },
      });
    } catch (error) {
      console.error('Export PDF error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report',
        error: error.message,
      });
    }
  }
);

module.exports = router;
