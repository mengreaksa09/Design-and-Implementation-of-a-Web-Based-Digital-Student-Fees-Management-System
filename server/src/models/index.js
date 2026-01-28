const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance based on dialect
let sequelize;
if (dbConfig.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbConfig.storage,
    logging: dbConfig.logging,
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      pool: dbConfig.pool,
    }
  );
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user.model')(sequelize, Sequelize);
db.Student = require('./student.model')(sequelize, Sequelize);
db.Department = require('./department.model')(sequelize, Sequelize);
db.Course = require('./course.model')(sequelize, Sequelize);
db.FeeStructure = require('./feeStructure.model')(sequelize, Sequelize);
db.FeeAssignment = require('./feeAssignment.model')(sequelize, Sequelize);
db.Payment = require('./payment.model')(sequelize, Sequelize);
db.Transaction = require('./transaction.model')(sequelize, Sequelize);
db.Notification = require('./notification.model')(sequelize, Sequelize);
db.ActivityLog = require('./activityLog.model')(sequelize, Sequelize);
db.Settings = require('./settings.model')(sequelize, Sequelize);

// Define associations
// User - Student (One-to-One)
db.User.hasOne(db.Student, { foreignKey: 'userId', as: 'studentProfile' });
db.Student.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// FeeAssignment - Student (Many-to-One)
db.Student.hasMany(db.FeeAssignment, {
  foreignKey: 'studentId',
  as: 'feeAssignments',
});
db.FeeAssignment.belongsTo(db.Student, {
  foreignKey: 'studentId',
  as: 'student',
});

// FeeAssignment - FeeStructure (Many-to-One)
db.FeeStructure.hasMany(db.FeeAssignment, {
  foreignKey: 'feeStructureId',
  as: 'assignments',
});
db.FeeAssignment.belongsTo(db.FeeStructure, {
  foreignKey: 'feeStructureId',
  as: 'feeStructure',
});

// Payment - Student (Many-to-One)
db.Student.hasMany(db.Payment, { foreignKey: 'studentId', as: 'payments' });
db.Payment.belongsTo(db.Student, { foreignKey: 'studentId', as: 'student' });

// Payment - FeeAssignment (Many-to-One)
db.FeeAssignment.hasMany(db.Payment, {
  foreignKey: 'feeAssignmentId',
  as: 'payments',
});
db.Payment.belongsTo(db.FeeAssignment, {
  foreignKey: 'feeAssignmentId',
  as: 'feeAssignment',
});

// Transaction - Payment (One-to-One)
db.Payment.hasOne(db.Transaction, {
  foreignKey: 'paymentId',
  as: 'transaction',
});
db.Transaction.belongsTo(db.Payment, {
  foreignKey: 'paymentId',
  as: 'payment',
});

// Notification - User (Many-to-One)
db.User.hasMany(db.Notification, { foreignKey: 'userId', as: 'notifications' });
db.Notification.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// ActivityLog - User (Many-to-One)
db.User.hasMany(db.ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
db.ActivityLog.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// Department - Course (One-to-Many)
db.Department.hasMany(db.Course, { foreignKey: 'departmentId', as: 'courses' });
db.Course.belongsTo(db.Department, {
  foreignKey: 'departmentId',
  as: 'department',
});

module.exports = db;
