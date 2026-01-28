const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { auth, authorize } = require('../middleware/auth.middleware');
const { logActivity } = require('../middleware/activityLog.middleware');
const { paginate, buildPaginationResponse } = require('../utils/helpers.util');
const db = require('../models');
const { Op } = require('sequelize');

// Get all users (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const { limit: limitVal, offset } = paginate(page, limit);

    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status !== undefined) {
      where.isActive = status === 'active';
    }

    const { count, rows: users } = await db.User.findAndCountAll({
      where,
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
      },
      limit: limitVal,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      ...buildPaginationResponse(users, count, page, limit),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message,
    });
  }
});

// Get single user
router.get('/:id', auth, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'],
      },
      include: [
        {
          model: db.Student,
          as: 'studentProfile',
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message,
    });
  }
});

// Create user (Admin only)
router.post(
  '/',
  auth,
  authorize('admin'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('role')
      .isIn(['admin', 'accountant', 'student', 'parent'])
      .withMessage('Invalid role'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;

      // Check if user exists
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await db.User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
      });

      logActivity(
        req.user.id,
        'CREATE_USER',
        'User',
        user.id,
        `Created user: ${email}`,
        null,
        { email, role },
        req
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message,
      });
    }
  }
);

// Update user
router.put(
  '/:id',
  auth,
  authorize('admin'),
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('firstName')
      .optional()
      .notEmpty()
      .withMessage('First name cannot be empty'),
    body('lastName')
      .optional()
      .notEmpty()
      .withMessage('Last name cannot be empty'),
    body('role')
      .optional()
      .isIn(['admin', 'accountant', 'student', 'parent'])
      .withMessage('Invalid role'),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await db.User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const { email, firstName, lastName, phone, role, isActive } = req.body;
      const oldValues = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };

      // Check email uniqueness if changing
      if (email && email !== user.email) {
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use',
          });
        }
      }

      await user.update({
        email: email || user.email,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        phone: phone !== undefined ? phone : user.phone,
        role: role || user.role,
        isActive: isActive !== undefined ? isActive : user.isActive,
      });

      logActivity(
        req.user.id,
        'UPDATE_USER',
        'User',
        user.id,
        `Updated user: ${user.email}`,
        oldValues,
        req.body,
        req
      );

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message,
      });
    }
  }
);

// Delete user (soft delete - deactivate)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await db.User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    await user.update({ isActive: false });

    logActivity(
      req.user.id,
      'DELETE_USER',
      'User',
      user.id,
      `Deactivated user: ${user.email}`,
      null,
      null,
      req
    );

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
});

// Update own profile
router.put(
  '/profile/me',
  auth,
  [
    body('firstName')
      .optional()
      .notEmpty()
      .withMessage('First name cannot be empty'),
    body('lastName')
      .optional()
      .notEmpty()
      .withMessage('Last name cannot be empty'),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await db.User.findByPk(req.user.id);
      const { firstName, lastName, phone, avatar } = req.body;

      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        phone: phone !== undefined ? phone : user.phone,
        avatar: avatar !== undefined ? avatar : user.avatar,
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message,
      });
    }
  }
);

module.exports = router;
