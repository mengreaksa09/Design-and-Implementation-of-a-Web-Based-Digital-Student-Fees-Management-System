const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { auth, authorize } = require('../middleware/auth.middleware');
const { logActivity } = require('../middleware/activityLog.middleware');
const {
  paginate,
  buildPaginationResponse,
  calculateLateFee,
} = require('../utils/helpers.util');
const db = require('../models');
const { Op } = require('sequelize');

// =============== FEE STRUCTURE ROUTES ===============

// Get all fee structures
router.get(
  '/structures',
  auth,
  authorize('admin', 'accountant'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        feeType,
        academicYear,
        isActive,
      } = req.query;
      const { limit: limitVal, offset } = paginate(page, limit);

      const where = {};
      if (feeType) where.feeType = feeType;
      if (academicYear) where.academicYear = academicYear;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const { count, rows: structures } = await db.FeeStructure.findAndCountAll(
        {
          where,
          limit: limitVal,
          offset,
          order: [['createdAt', 'DESC']],
        }
      );

      res.json({
        success: true,
        ...buildPaginationResponse(structures, count, page, limit),
      });
    } catch (error) {
      console.error('Get fee structures error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get fee structures',
        error: error.message,
      });
    }
  }
);

// Get fee structure by ID
router.get('/structures/:id', auth, async (req, res) => {
  try {
    const structure = await db.FeeStructure.findByPk(req.params.id);

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found',
      });
    }

    res.json({
      success: true,
      data: structure,
    });
  } catch (error) {
    console.error('Get fee structure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get fee structure',
      error: error.message,
    });
  }
});

// Create fee structure
router.post(
  '/structures',
  auth,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('feeType')
      .isIn([
        'tuition',
        'exam',
        'library',
        'transport',
        'laboratory',
        'sports',
        'hostel',
        'other',
      ])
      .withMessage('Invalid fee type'),
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        name,
        description,
        feeType,
        amount,
        currency,
        frequency,
        applicableClasses,
        applicableDepartments,
        academicYear,
        dueDate,
        lateFeePercentage,
        lateFeeAmount,
        gracePeriodDays,
        isMandatory,
      } = req.body;

      const structure = await db.FeeStructure.create({
        name,
        description,
        feeType,
        amount,
        currency: currency || 'USD',
        frequency: frequency || 'semester',
        applicableClasses,
        applicableDepartments,
        academicYear,
        dueDate,
        lateFeePercentage: lateFeePercentage || 0,
        lateFeeAmount: lateFeeAmount || 0,
        gracePeriodDays: gracePeriodDays || 0,
        isMandatory: isMandatory !== false,
      });

      logActivity(
        req.user.id,
        'CREATE_FEE_STRUCTURE',
        'FeeStructure',
        structure.id,
        `Created fee structure: ${name}`,
        null,
        req.body,
        req
      );

      res.status(201).json({
        success: true,
        message: 'Fee structure created successfully',
        data: structure,
      });
    } catch (error) {
      console.error('Create fee structure error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create fee structure',
        error: error.message,
      });
    }
  }
);

// Update fee structure
router.put('/structures/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const structure = await db.FeeStructure.findByPk(req.params.id);

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found',
      });
    }

    const oldValues = structure.toJSON();

    await structure.update(req.body);

    logActivity(
      req.user.id,
      'UPDATE_FEE_STRUCTURE',
      'FeeStructure',
      structure.id,
      `Updated fee structure: ${structure.name}`,
      oldValues,
      req.body,
      req
    );

    res.json({
      success: true,
      message: 'Fee structure updated successfully',
      data: structure,
    });
  } catch (error) {
    console.error('Update fee structure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fee structure',
      error: error.message,
    });
  }
});

// Delete fee structure
router.delete('/structures/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const structure = await db.FeeStructure.findByPk(req.params.id);

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found',
      });
    }

    // Check if there are any assignments
    const assignmentCount = await db.FeeAssignment.count({
      where: { feeStructureId: structure.id },
    });
    if (assignmentCount > 0) {
      // Soft delete
      await structure.update({ isActive: false });
      return res.json({
        success: true,
        message: 'Fee structure deactivated (has existing assignments)',
      });
    }

    await structure.destroy();

    logActivity(
      req.user.id,
      'DELETE_FEE_STRUCTURE',
      'FeeStructure',
      req.params.id,
      `Deleted fee structure: ${structure.name}`,
      null,
      null,
      req
    );

    res.json({
      success: true,
      message: 'Fee structure deleted successfully',
    });
  } catch (error) {
    console.error('Delete fee structure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fee structure',
      error: error.message,
    });
  }
});

// =============== FEE ASSIGNMENT ROUTES ===============

// Assign fees to students
router.post(
  '/assign',
  auth,
  authorize('admin', 'accountant'),
  [
    body('feeStructureId').notEmpty().withMessage('Fee structure is required'),
    body('studentIds')
      .isArray({ min: 1 })
      .withMessage('At least one student is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        feeStructureId,
        studentIds,
        discountAmount,
        discountReason,
        dueDate,
        academicYear,
        semester,
      } = req.body;

      const feeStructure = await db.FeeStructure.findByPk(feeStructureId);
      if (!feeStructure) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found',
        });
      }

      const assignments = [];
      const errors = [];

      for (const studentId of studentIds) {
        try {
          const student = await db.Student.findByPk(studentId);
          if (!student) {
            errors.push({ studentId, error: 'Student not found' });
            continue;
          }

          // Check if already assigned
          const whereClause = {
            studentId,
            feeStructureId,
          };
          if (academicYear || feeStructure.academicYear) {
            whereClause.academicYear =
              academicYear || feeStructure.academicYear;
          }
          if (semester) {
            whereClause.semester = semester;
          }
          const existingAssignment = await db.FeeAssignment.findOne({
            where: whereClause,
          });

          if (existingAssignment) {
            errors.push({
              studentId,
              error: 'Fee already assigned for this period',
            });
            continue;
          }

          const originalAmount = parseFloat(feeStructure.amount);
          const discount = parseFloat(discountAmount) || 0;
          const totalAmount = originalAmount - discount;

          const assignment = await db.FeeAssignment.create({
            studentId,
            feeStructureId,
            originalAmount,
            discountAmount: discount,
            discountReason,
            totalAmount,
            balanceAmount: totalAmount,
            dueDate:
              dueDate ||
              feeStructure.dueDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            academicYear: academicYear || feeStructure.academicYear,
            semester,
          });

          assignments.push(assignment);
        } catch (error) {
          errors.push({ studentId, error: error.message });
        }
      }

      logActivity(
        req.user.id,
        'ASSIGN_FEES',
        'FeeAssignment',
        null,
        `Assigned ${feeStructure.name} to ${assignments.length} students`,
        null,
        null,
        req
      );

      res.status(201).json({
        success: true,
        message: `Fees assigned to ${assignments.length} students`,
        data: {
          assigned: assignments.length,
          failed: errors.length,
          errors,
        },
      });
    } catch (error) {
      console.error('Assign fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign fees',
        error: error.message,
      });
    }
  }
);

// Assign fees by class/department
router.post(
  '/assign-bulk',
  auth,
  authorize('admin', 'accountant'),
  [body('feeStructureId').notEmpty().withMessage('Fee structure is required')],
  validate,
  async (req, res) => {
    try {
      const {
        feeStructureId,
        class: studentClass,
        department,
        discountAmount,
        discountReason,
        dueDate,
        academicYear,
        semester,
      } = req.body;

      const feeStructure = await db.FeeStructure.findByPk(feeStructureId);
      if (!feeStructure) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found',
        });
      }

      const studentWhere = { status: 'active' };
      if (studentClass) studentWhere.class = studentClass;
      if (department) studentWhere.department = department;

      const students = await db.Student.findAll({ where: studentWhere });

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No students found matching criteria',
        });
      }

      const studentIds = students.map((s) => s.id);

      // Use the same logic as individual assignment
      req.body.studentIds = studentIds;

      const assignments = [];
      const errors = [];

      for (const studentId of studentIds) {
        try {
          const whereClause = {
            studentId,
            feeStructureId,
          };
          if (academicYear || feeStructure.academicYear) {
            whereClause.academicYear =
              academicYear || feeStructure.academicYear;
          }
          if (semester) {
            whereClause.semester = semester;
          }
          const existingAssignment = await db.FeeAssignment.findOne({
            where: whereClause,
          });

          if (existingAssignment) {
            errors.push({ studentId, error: 'Fee already assigned' });
            continue;
          }

          const originalAmount = parseFloat(feeStructure.amount);
          const discount = parseFloat(discountAmount) || 0;
          const totalAmount = originalAmount - discount;

          const assignment = await db.FeeAssignment.create({
            studentId,
            feeStructureId,
            originalAmount,
            discountAmount: discount,
            discountReason,
            totalAmount,
            balanceAmount: totalAmount,
            dueDate:
              dueDate ||
              feeStructure.dueDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            academicYear: academicYear || feeStructure.academicYear,
            semester,
          });

          assignments.push(assignment);
        } catch (error) {
          errors.push({ studentId, error: error.message });
        }
      }

      logActivity(
        req.user.id,
        'BULK_ASSIGN_FEES',
        'FeeAssignment',
        null,
        `Bulk assigned ${feeStructure.name} to ${assignments.length} students`,
        null,
        null,
        req
      );

      res.status(201).json({
        success: true,
        message: `Fees assigned to ${assignments.length} students`,
        data: {
          totalStudents: students.length,
          assigned: assignments.length,
          failed: errors.length,
          errors: errors.slice(0, 10), // Limit errors in response
        },
      });
    } catch (error) {
      console.error('Bulk assign fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign fees',
        error: error.message,
      });
    }
  }
);

// Get fee assignments
router.get('/assignments', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, studentId, status, feeType } = req.query;
    const { limit: limitVal, offset } = paginate(page, limit);

    const where = {};

    // For student role, only show their own fees
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

    const include = [
      {
        model: db.FeeStructure,
        as: 'feeStructure',
        where: feeType ? { feeType } : {},
      },
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
    ];

    const { count, rows: assignments } = await db.FeeAssignment.findAndCountAll(
      {
        where,
        include,
        limit: limitVal,
        offset,
        order: [['dueDate', 'ASC']],
      }
    );

    // Calculate late fees for overdue assignments
    const updatedAssignments = assignments.map((assignment) => {
      const data = assignment.toJSON();
      if (data.status === 'pending' || data.status === 'partial') {
        const lateFeeInfo = calculateLateFee(
          data.dueDate,
          data.balanceAmount,
          data.feeStructure?.lateFeePercentage || 0,
          data.feeStructure?.lateFeeAmount || 0,
          data.feeStructure?.gracePeriodDays || 0
        );
        data.lateFeeInfo = lateFeeInfo;
      }
      return data;
    });

    res.json({
      success: true,
      ...buildPaginationResponse(updatedAssignments, count, page, limit),
    });
  } catch (error) {
    console.error('Get fee assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get fee assignments',
      error: error.message,
    });
  }
});

// Get student's fee summary
router.get('/summary/:studentId', auth, async (req, res) => {
  try {
    let studentId = req.params.studentId;

    // For student role, only allow viewing own summary
    if (req.user.role === 'student') {
      const student = await db.Student.findOne({
        where: { userId: req.user.id },
      });
      if (!student || student.id !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
      studentId = student.id;
    }

    const assignments = await db.FeeAssignment.findAll({
      where: { studentId },
      include: [
        {
          model: db.FeeStructure,
          as: 'feeStructure',
        },
      ],
    });

    const summary = {
      totalFees: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      byStatus: {
        pending: 0,
        partial: 0,
        paid: 0,
        overdue: 0,
        waived: 0,
      },
      byType: {},
    };

    assignments.forEach((assignment) => {
      summary.totalFees += parseFloat(assignment.totalAmount);
      summary.totalPaid += parseFloat(assignment.paidAmount);

      if (
        assignment.status === 'overdue' ||
        (assignment.status !== 'paid' &&
          new Date(assignment.dueDate) < new Date())
      ) {
        summary.totalOverdue += parseFloat(assignment.balanceAmount);
        summary.byStatus.overdue++;
      } else if (assignment.status !== 'paid') {
        summary.totalPending += parseFloat(assignment.balanceAmount);
        summary.byStatus[assignment.status]++;
      } else {
        summary.byStatus.paid++;
      }

      const feeType = assignment.feeStructure?.feeType || 'other';
      if (!summary.byType[feeType]) {
        summary.byType[feeType] = { total: 0, paid: 0, pending: 0 };
      }
      summary.byType[feeType].total += parseFloat(assignment.totalAmount);
      summary.byType[feeType].paid += parseFloat(assignment.paidAmount);
      summary.byType[feeType].pending += parseFloat(assignment.balanceAmount);
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get fee summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get fee summary',
      error: error.message,
    });
  }
});

// Update late fees (cron job or manual trigger)
router.post('/update-late-fees', auth, authorize('admin'), async (req, res) => {
  try {
    const overdueAssignments = await db.FeeAssignment.findAll({
      where: {
        status: { [Op.in]: ['pending', 'partial'] },
        dueDate: { [Op.lt]: new Date() },
      },
      include: [
        {
          model: db.FeeStructure,
          as: 'feeStructure',
        },
      ],
    });

    let updated = 0;

    for (const assignment of overdueAssignments) {
      const lateFeeInfo = calculateLateFee(
        assignment.dueDate,
        assignment.originalAmount,
        assignment.feeStructure?.lateFeePercentage || 0,
        assignment.feeStructure?.lateFeeAmount || 0,
        assignment.feeStructure?.gracePeriodDays || 0
      );

      if (
        lateFeeInfo.isOverdue &&
        lateFeeInfo.lateFee > assignment.lateFeeApplied
      ) {
        const newLateFee = lateFeeInfo.lateFee;
        const newTotalAmount =
          parseFloat(assignment.originalAmount) -
          parseFloat(assignment.discountAmount) +
          newLateFee;
        const newBalance = newTotalAmount - parseFloat(assignment.paidAmount);

        await assignment.update({
          lateFeeApplied: newLateFee,
          totalAmount: newTotalAmount,
          balanceAmount: newBalance,
          status: 'overdue',
        });
        updated++;
      }
    }

    logActivity(
      req.user.id,
      'UPDATE_LATE_FEES',
      'FeeAssignment',
      null,
      `Updated late fees for ${updated} assignments`,
      null,
      null,
      req
    );

    res.json({
      success: true,
      message: `Updated late fees for ${updated} assignments`,
      data: { updated },
    });
  } catch (error) {
    console.error('Update late fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update late fees',
      error: error.message,
    });
  }
});

module.exports = router;
