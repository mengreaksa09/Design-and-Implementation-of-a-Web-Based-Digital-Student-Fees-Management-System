const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { auth, authorize } = require('../middleware/auth.middleware');
const { logActivity } = require('../middleware/activityLog.middleware');
const { paginate, buildPaginationResponse } = require('../utils/helpers.util');
const db = require('../models');
const { Op } = require('sequelize');

// =============== DEPARTMENT ROUTES ===============

// Get all departments
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const { limit: limitVal, offset } = paginate(page, limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows: departments } = await db.Department.findAndCountAll({
      where,
      limit: limitVal,
      offset,
      order: [['name', 'ASC']],
      include: [
        {
          model: db.Course,
          as: 'courses',
          attributes: ['id', 'code', 'name', 'isActive'],
        },
      ],
    });

    res.json({
      success: true,
      ...buildPaginationResponse(departments, count, page, limit),
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get departments',
      error: error.message,
    });
  }
});

// Get all departments (simple list for dropdowns)
router.get('/list', auth, async (req, res) => {
  try {
    const departments = await db.Department.findAll({
      where: { isActive: true },
      attributes: ['id', 'code', 'name'],
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('Get departments list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get departments list',
      error: error.message,
    });
  }
});

// Get department by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const department = await db.Department.findByPk(req.params.id, {
      include: [
        {
          model: db.Course,
          as: 'courses',
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department',
      error: error.message,
    });
  }
});

// Create department
router.post(
  '/',
  auth,
  authorize('admin'),
  [
    body('code')
      .notEmpty()
      .withMessage('Department code is required')
      .matches(/^[A-Z0-9-]+$/)
      .withMessage(
        'Department code must contain only uppercase letters, numbers, and hyphens'
      ),
    body('name').notEmpty().withMessage('Department name is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        headOfDepartment,
        email,
        phone,
        location,
        establishedYear,
        facultyCount,
        studentCapacity,
      } = req.body;

      // Check if department code already exists
      const existingDept = await db.Department.findOne({ where: { code } });
      if (existingDept) {
        return res.status(400).json({
          success: false,
          message: 'Department code already exists',
        });
      }

      const department = await db.Department.create({
        code: code.toUpperCase(),
        name,
        description,
        headOfDepartment,
        email,
        phone,
        location,
        establishedYear,
        facultyCount: facultyCount || 0,
        studentCapacity,
      });

      logActivity(
        req.user.id,
        'CREATE_DEPARTMENT',
        `Created department: ${name} (${code})`,
        { departmentId: department.id }
      );

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department,
      });
    } catch (error) {
      console.error('Create department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create department',
        error: error.message,
      });
    }
  }
);

// Update department
router.put(
  '/:id',
  auth,
  authorize('admin'),
  [
    body('code')
      .optional()
      .matches(/^[A-Z0-9-]+$/)
      .withMessage(
        'Department code must contain only uppercase letters, numbers, and hyphens'
      ),
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Department name cannot be empty'),
  ],
  validate,
  async (req, res) => {
    try {
      const department = await db.Department.findByPk(req.params.id);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }

      const {
        code,
        name,
        description,
        headOfDepartment,
        email,
        phone,
        location,
        isActive,
        establishedYear,
        facultyCount,
        studentCapacity,
      } = req.body;

      // Check if new code conflicts with existing department
      if (code && code !== department.code) {
        const existingDept = await db.Department.findOne({ where: { code } });
        if (existingDept) {
          return res.status(400).json({
            success: false,
            message: 'Department code already exists',
          });
        }
      }

      await department.update({
        code: code ? code.toUpperCase() : department.code,
        name: name || department.name,
        description,
        headOfDepartment,
        email,
        phone,
        location,
        isActive: isActive !== undefined ? isActive : department.isActive,
        establishedYear,
        facultyCount,
        studentCapacity,
      });

      logActivity(
        req.user.id,
        'UPDATE_DEPARTMENT',
        `Updated department: ${department.name} (${department.code})`,
        { departmentId: department.id }
      );

      res.json({
        success: true,
        message: 'Department updated successfully',
        data: department,
      });
    } catch (error) {
      console.error('Update department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update department',
        error: error.message,
      });
    }
  }
);

// Delete department
router.delete(
  '/:id',
  auth,
  authorize('admin'),
  async (req, res) => {
    try {
      const department = await db.Department.findByPk(req.params.id);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }

      // Check if department has courses
      const coursesCount = await db.Course.count({
        where: { departmentId: department.id },
      });

      if (coursesCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete department with existing courses',
        });
      }

      await department.destroy();

      logActivity(
        req.user.id,
        'DELETE_DEPARTMENT',
        `Deleted department: ${department.name} (${department.code})`,
        { departmentId: department.id }
      );

      res.json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      console.error('Delete department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete department',
        error: error.message,
      });
    }
  }
);

module.exports = router;
