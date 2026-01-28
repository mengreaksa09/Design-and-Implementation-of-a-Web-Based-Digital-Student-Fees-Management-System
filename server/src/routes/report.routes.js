const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const {
  generateExcelReport,
  generatePdfReport,
} = require('../utils/export.util');
const { parseDateRange } = require('../utils/helpers.util');
const db = require('../models');
const { Op } = require('sequelize');

// Dashboard summary
router.get(
  '/dashboard',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      // Total students
      const totalStudents = await db.Student.count({
        where: { status: 'active' },
      });

      // Total fees collected
      const totalCollected =
        (await db.Payment.sum('amount', {
          where: { status: 'completed' },
        })) || 0;

      // Pending fees
      const pendingFees =
        (await db.FeeAssignment.sum('balanceAmount', {
          where: { status: { [Op.in]: ['pending', 'partial'] } },
        })) || 0;

      // Overdue fees
      const overdueFees =
        (await db.FeeAssignment.sum('balanceAmount', {
          where: {
            status: { [Op.in]: ['pending', 'partial', 'overdue'] },
            dueDate: { [Op.lt]: new Date() },
          },
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

      // Recent payments
      const recentPayments = await db.Payment.findAll({
        where: { status: 'completed' },
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

      // Fee collection by type
      const collectionByType = await db.Payment.findAll({
        where: { status: 'completed' },
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

      // Payment methods breakdown
      const paymentMethods = await db.Payment.findAll({
        where: { status: 'completed' },
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
          dueDate: { [Op.lt]: new Date() },
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

// Daily collection report
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

// Monthly collection report
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
          dueDate: { [Op.lt]: new Date() },
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
        const daysOverdue = Math.ceil(
          (new Date() - new Date(d.dueDate)) / (1000 * 60 * 60 * 24)
        );
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
