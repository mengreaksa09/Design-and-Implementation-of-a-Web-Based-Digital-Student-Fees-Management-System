const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { auth, authorize } = require('../middleware/auth.middleware');
const { logActivity } = require('../middleware/activityLog.middleware');
const { paginate, buildPaginationResponse } = require('../utils/helpers.util');
const db = require('../models');
const { Op } = require('sequelize');

// =============== COURSE ROUTES ===============

// Get all courses
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      level,
      isActive,
    } = req.query;
    const { limit: limitVal, offset } = paginate(page, limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;
    if (level) where.level = level;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows: courses } = await db.Course.findAndCountAll({
      where,
      limit: limitVal,
      offset,
      order: [['name', 'ASC']],
      include: [
        {
          model: db.Department,
          as: 'department',
          attributes: ['id', 'code', 'name'],
        },
      ],
    });

    res.json({
      success: true,
      ...buildPaginationResponse(courses, count, page, limit),
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses',
      error: error.message,
    });
  }
});

// Get all courses (simple list for dropdowns)
router.get('/list', auth, async (req, res) => {
  try {
    const { departmentId } = req.query;
    const where = { isActive: true };
    if (departmentId) where.departmentId = departmentId;

    const courses = await db.Course.findAll({
      where,
      attributes: ['id', 'code', 'name', 'departmentId'],
      order: [['name', 'ASC']],
      include: [
        {
          model: db.Department,
          as: 'department',
          attributes: ['id', 'name'],
        },
      ],
    });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error('Get courses list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses list',
      error: error.message,
    });
  }
});

// Get course by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await db.Course.findByPk(req.params.id, {
      include: [
        {
          model: db.Department,
          as: 'department',
        },
      ],
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course',
      error: error.message,
    });
  }
});

// Create course
router.post(
  '/',
  auth,
  authorize('admin'),
  [
    body('code')
      .notEmpty()
      .withMessage('Course code is required')
      .matches(/^[A-Z0-9-]+$/)
      .withMessage(
        'Course code must contain only uppercase letters, numbers, and hyphens'
      ),
    body('name').notEmpty().withMessage('Course name is required'),
    body('departmentId').notEmpty().withMessage('Department is required'),
    body('duration')
      .isInt({ min: 1, max: 10 })
      .withMessage('Duration must be between 1 and 10 years'),
    body('credits')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Credits must be between 1 and 10'),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        departmentId,
        credits,
        duration,
        level,
        tuitionFee,
        admissionRequirements,
        maxStudents,
        coordinator,
        accreditation,
      } = req.body;

      // Check if department exists
      const department = await db.Department.findByPk(departmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }

      // Check if course code already exists
      const existingCourse = await db.Course.findOne({ where: { code } });
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course code already exists',
        });
      }

      const course = await db.Course.create({
        code: code.toUpperCase(),
        name,
        description,
        departmentId,
        credits: credits || 3,
        duration,
        level: level || 'undergraduate',
        tuitionFee,
        admissionRequirements,
        maxStudents,
        coordinator,
        accreditation,
      });

      // Load department relation
      await course.reload({
        include: [
          {
            model: db.Department,
            as: 'department',
          },
        ],
      });

      logActivity(
        req.user.id,
        'CREATE_COURSE',
        `Created course: ${name} (${code})`,
        { courseId: course.id }
      );

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course,
      });
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create course',
        error: error.message,
      });
    }
  }
);

// Update course
router.put(
  '/:id',
  auth,
  authorize('admin'),
  [
    body('code')
      .optional()
      .matches(/^[A-Z0-9-]+$/)
      .withMessage(
        'Course code must contain only uppercase letters, numbers, and hyphens'
      ),
    body('name')
      .optional()
      .notEmpty()
      .withMessage('Course name cannot be empty'),
    body('duration')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Duration must be between 1 and 10 years'),
    body('credits')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Credits must be between 1 and 10'),
  ],
  validate,
  async (req, res) => {
    try {
      const course = await db.Course.findByPk(req.params.id);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      const {
        code,
        name,
        description,
        departmentId,
        credits,
        duration,
        level,
        tuitionFee,
        admissionRequirements,
        isActive,
        maxStudents,
        currentEnrollment,
        coordinator,
        accreditation,
      } = req.body;

      // If department is being changed, verify it exists
      if (departmentId && departmentId !== course.departmentId) {
        const department = await db.Department.findByPk(departmentId);
        if (!department) {
          return res.status(404).json({
            success: false,
            message: 'Department not found',
          });
        }
      }

      // Check if new code conflicts with existing course
      if (code && code !== course.code) {
        const existingCourse = await db.Course.findOne({ where: { code } });
        if (existingCourse) {
          return res.status(400).json({
            success: false,
            message: 'Course code already exists',
          });
        }
      }

      await course.update({
        code: code ? code.toUpperCase() : course.code,
        name: name || course.name,
        description,
        departmentId: departmentId || course.departmentId,
        credits: credits !== undefined ? credits : course.credits,
        duration: duration !== undefined ? duration : course.duration,
        level: level || course.level,
        tuitionFee,
        admissionRequirements,
        isActive: isActive !== undefined ? isActive : course.isActive,
        maxStudents,
        currentEnrollment:
          currentEnrollment !== undefined
            ? currentEnrollment
            : course.currentEnrollment,
        coordinator,
        accreditation,
      });

      // Reload with department
      await course.reload({
        include: [
          {
            model: db.Department,
            as: 'department',
          },
        ],
      });

      logActivity(
        req.user.id,
        'UPDATE_COURSE',
        `Updated course: ${course.name} (${course.code})`,
        { courseId: course.id }
      );

      res.json({
        success: true,
        message: 'Course updated successfully',
        data: course,
      });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update course',
        error: error.message,
      });
    }
  }
);

// Delete course
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const course = await db.Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Note: Students don't directly reference courses, so we can delete the course
    // If you need to check for students, you would need to add a courseId field to Student model

    await course.destroy();

    logActivity(
      req.user.id,
      'DELETE_COURSE',
      `Deleted course: ${course.name} (${course.code})`,
      { courseId: course.id }
    );

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message,
    });
  }
});

module.exports = router;
