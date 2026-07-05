require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const studentRoutes = require('./routes/student.routes');
const departmentRoutes = require('./routes/department.routes');
const courseRoutes = require('./routes/course.routes');
const feeRoutes = require('./routes/fee.routes');
const paymentRoutes = require('./routes/payment.routes');
const reportRoutes = require('./routes/report.routes');
const settingsRoutes = require('./routes/settings.routes');
const notificationRoutes = require('./routes/notification.routes');
const telegramRoutes = require('./routes/telegram.routes');

// Import database
const db = require('./models');

// Import Telegram bot service
const { initBot } = require('./services/telegram.service');
const {
  startNotificationScheduler,
} = require('./services/notification.service');

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for receipts
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/receipts', express.static(path.join(__dirname, 'receipts')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/telegram', telegramRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Student Fees Management System API is running',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;

// Sync database and start server
db.sequelize
  .sync({ force: false })
  .then(async () => {
    console.log('Database synced successfully');

    // Manually add telegram columns if they don't exist
    try {
      await db.sequelize.query(`
        ALTER TABLE students ADD COLUMN telegramChatId VARCHAR(255);
      `);
      console.log('Added telegramChatId column');
    } catch (err) {
      // Column might already exist, ignore error
      if (!err.message.includes('duplicate column name') && !err.message.includes('Duplicate column name')) {
        console.log(
          'telegramChatId column already exists or error:',
          err.message
        );
      }
    }

    try {
      await db.sequelize.query(`
        ALTER TABLE students ADD COLUMN telegramUsername VARCHAR(255);
      `);
      console.log('Added telegramUsername column');
    } catch (err) {
      // Column might already exist, ignore error
      if (!err.message.includes('duplicate column name') && !err.message.includes('Duplicate column name')) {
        console.log(
          'telegramUsername column already exists or error:',
          err.message
        );
      }
    }

    // Add course column if it doesn't exist
    try {
      await db.sequelize.query(`
        ALTER TABLE students ADD COLUMN course VARCHAR(255);
      `);
      console.log('Added course column');
    } catch (err) {
      // Column might already exist, ignore error
      if (!err.message.includes('duplicate column name') && !err.message.includes('Duplicate column name')) {
        console.log('course column already exists or error:', err.message);
      }
    }

    // Add Student_ID column if it doesn't exist
    try {
      await db.sequelize.query(`
        ALTER TABLE students ADD COLUMN Student_ID VARCHAR(255);
      `);
      console.log('Added Student_ID column');
    } catch (err) {
      if (!err.message.includes('duplicate column name') && !err.message.includes('Duplicate column name')) {
        console.log('Student_ID column already exists or error:', err.message);
      }
    }

    // Add Full_Name column if it doesn't exist
    try {
      await db.sequelize.query(`
        ALTER TABLE students ADD COLUMN Full_Name VARCHAR(255);
      `);
      console.log('Added Full_Name column');
    } catch (err) {
      if (!err.message.includes('duplicate column name') && !err.message.includes('Duplicate column name')) {
        console.log('Full_Name column already exists or error:', err.message);
      }
    }

    // Add Telegram_Chat_ID column if it doesn't exist
    try {
      await db.sequelize.query(`
        ALTER TABLE students ADD COLUMN Telegram_Chat_ID VARCHAR(255);
      `);
      console.log('Added Telegram_Chat_ID column');
    } catch (err) {
      if (!err.message.includes('duplicate column name') && !err.message.includes('Duplicate column name')) {
        console.log('Telegram_Chat_ID column already exists or error:', err.message);
      }
    }

    // Initialize Telegram bot
    initBot();

    // Start notification scheduler
    startNotificationScheduler();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('Failed to sync database:', err);
  });

module.exports = app;
