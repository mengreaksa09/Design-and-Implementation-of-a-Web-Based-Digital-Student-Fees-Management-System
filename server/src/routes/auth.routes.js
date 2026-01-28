const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { auth } = require('../middleware/auth.middleware');
const { logActivity } = require('../middleware/activityLog.middleware');
const { sendEmail } = require('../utils/email.util');
const db = require('../models');

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role')
    .optional()
    .isIn(['admin', 'accountant', 'student', 'parent'])
    .withMessage('Invalid role'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register new user
router.post('/register', registerValidation, validate, async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role = 'student',
    } = req.body;

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

    // Create user
    const user = await db.User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Send welcome email
    sendEmail(email, 'welcomeEmail', {
      name: `${firstName} ${lastName}`,
      email,
      role,
    });

    // Log activity
    logActivity(
      user.id,
      'REGISTER',
      'User',
      user.id,
      'User registered successfully'
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
});

// Login
router.post('/login', loginValidation, validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.User.findOne({
      where: { email },
      include: [
        {
          model: db.Student,
          as: 'studentProfile',
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message:
          'Your account has been deactivated. Please contact administrator.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Log activity
    logActivity(
      user.id,
      'LOGIN',
      'User',
      user.id,
      'User logged in',
      null,
      null,
      req
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          studentProfile: user.studentProfile,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
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

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message,
    });
  }
});

// Update password
router.put(
  '/password',
  auth,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await db.User.findByPk(req.user.id);

      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await user.update({ password: hashedPassword });

      // Log activity
      logActivity(
        user.id,
        'PASSWORD_CHANGE',
        'User',
        user.id,
        'Password changed',
        null,
        null,
        req
      );

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update password',
        error: error.message,
      });
    }
  }
);

// Forgot password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await db.User.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if user exists
        return res.json({
          success: true,
          message:
            'If an account exists with this email, you will receive a password reset link.',
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      await user.update({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour
      });

      // Send reset email
      const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      await sendEmail(email, 'passwordReset', {
        name: `${user.firstName} ${user.lastName}`,
        resetLink,
      });

      res.json({
        success: true,
        message:
          'If an account exists with this email, you will receive a password reset link.',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process request',
        error: error.message,
      });
    }
  }
);

// Reset password
router.post(
  '/reset-password/:token',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const resetTokenHash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await db.User.findOne({
        where: {
          resetPasswordToken: resetTokenHash,
          resetPasswordExpires: { [db.Sequelize.Op.gt]: new Date() },
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await user.update({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      });

      // Log activity
      logActivity(
        user.id,
        'PASSWORD_RESET',
        'User',
        user.id,
        'Password reset via email'
      );

      res.json({
        success: true,
        message:
          'Password reset successful. You can now login with your new password.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password',
        error: error.message,
      });
    }
  }
);

// Logout (optional - for activity logging)
router.post('/logout', auth, async (req, res) => {
  try {
    logActivity(
      req.user.id,
      'LOGOUT',
      'User',
      req.user.id,
      'User logged out',
      null,
      null,
      req
    );

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
});

// Telegram Login - Auto-authenticate users from Telegram
router.post('/telegram-login', async (req, res) => {
  try {
    const { telegramId, firstName, lastName, username } = req.body;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram ID is required',
      });
    }

    // Find student by telegram chat ID
    const student = await db.Student.findOne({
      where: { telegramChatId: telegramId.toString() },
      include: [{ model: db.User, as: 'user' }],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          'No student account linked to this Telegram account. Please use /start command with your student ID in the bot.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: student.user.id,
        email: student.user.email,
        role: student.user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update user's last login
    await student.user.update({ lastLogin: new Date() });

    // Log activity
    logActivity(
      student.user.id,
      'LOGIN',
      'User',
      student.user.id,
      'Telegram auto-login',
      null,
      null,
      req
    );

    res.json({
      success: true,
      message: 'Logged in successfully via Telegram',
      token,
      user: {
        id: student.user.id,
        email: student.user.email,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        role: student.user.role,
        phone: student.user.phone,
        studentId: student.studentId,
      },
    });
  } catch (error) {
    console.error('Telegram login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during Telegram authentication',
      error: error.message,
    });
  }
});

module.exports = router;
