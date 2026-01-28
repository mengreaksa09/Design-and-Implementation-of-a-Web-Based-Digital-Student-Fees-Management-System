const { Student, FeeAssignment, FeeStructure } = require('../models');
const { sendDueDateReminder } = require('./telegram.service');
const { Op } = require('sequelize');

// Check and send due date reminders
const checkDueDateReminders = async () => {
  try {
    const today = new Date();
    const reminderDays = [7, 3, 1]; // Send reminders 7, 3, and 1 day before due date

    for (const days of reminderDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find fee assignments due on the target date
      const dueAssignments = await FeeAssignment.findAll({
        where: {
          dueDate: {
            [Op.gte]: targetDate,
            [Op.lt]: nextDay,
          },
          status: ['pending', 'partial'],
        },
        include: [
          {
            model: Student,
            as: 'student',
            where: {
              telegramChatId: { [Op.ne]: null },
            },
          },
          {
            model: FeeStructure,
            as: 'feeStructure',
          },
        ],
      });

      // Send reminders
      for (const assignment of dueAssignments) {
        const balance =
          parseFloat(assignment.amount) - parseFloat(assignment.paidAmount);

        await sendDueDateReminder(assignment.studentId, {
          feeName: assignment.feeStructure.name,
          balance: balance,
          dueDate: assignment.dueDate,
        });
      }

      console.log(
        `Sent ${dueAssignments.length} reminders for ${days}-day due date`
      );
    }
  } catch (error) {
    console.error('Error checking due date reminders:', error);
  }
};

// Check for overdue fees and send alerts
const checkOverdueFees = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find overdue fee assignments
    const overdueAssignments = await FeeAssignment.findAll({
      where: {
        dueDate: { [Op.lt]: today },
        status: ['pending', 'partial'],
      },
      include: [
        {
          model: Student,
          as: 'student',
          where: {
            telegramChatId: { [Op.ne]: null },
          },
        },
        {
          model: FeeStructure,
          as: 'feeStructure',
        },
      ],
    });

    // Update status to overdue
    for (const assignment of overdueAssignments) {
      await assignment.update({ status: 'overdue' });

      const balance =
        parseFloat(assignment.amount) - parseFloat(assignment.paidAmount);
      const daysOverdue = Math.ceil(
        (today - new Date(assignment.dueDate)) / (1000 * 60 * 60 * 24)
      );

      const { sendFeeAlert } = require('./telegram.service');
      await sendFeeAlert(
        assignment.studentId,
        `⚠️ OVERDUE FEE ALERT\n\n` +
          `Fee: ${assignment.feeStructure.name}\n` +
          `Amount Due: $${balance.toFixed(2)}\n` +
          `Days Overdue: ${daysOverdue}\n\n` +
          `Please make payment immediately to avoid penalties.`
      );
    }

    console.log(`Processed ${overdueAssignments.length} overdue fee alerts`);
  } catch (error) {
    console.error('Error checking overdue fees:', error);
  }
};

// Start the notification scheduler
const startNotificationScheduler = () => {
  // Check reminders daily at 9 AM
  const reminderInterval = 24 * 60 * 60 * 1000; // 24 hours

  // Initial check
  checkDueDateReminders();
  checkOverdueFees();

  // Schedule recurring checks
  setInterval(() => {
    checkDueDateReminders();
    checkOverdueFees();
  }, reminderInterval);

  console.log('Telegram notification scheduler started');
};

module.exports = {
  startNotificationScheduler,
  checkDueDateReminders,
  checkOverdueFees,
};
