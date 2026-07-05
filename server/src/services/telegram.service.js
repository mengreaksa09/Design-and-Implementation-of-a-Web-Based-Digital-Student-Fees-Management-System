const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {
  Student,
  User,
  FeeAssignment,
  Payment,
  FeeStructure,
} = require('../models');
const { formatCurrency } = require('../utils/helpers.util');

let bot;
const userPaymentState = new Map();

// Initialize the bot
const initBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not set in environment variables');
    return null;
  }

  try {
    bot = new TelegramBot(token, { polling: true });
    console.log('Telegram bot initialized successfully');

    // Add error handlers
    bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error.code, error.message);
    });

    bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });

    setupBotHandlers();
    return bot;
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    return null;
  }
};

// Setup all bot command handlers
const setupBotHandlers = () => {
  console.log('Setting up bot command handlers...');

  // /start command - Register student with their student ID
  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    console.log('Received /start command from', msg.chat.id);
    const chatId = msg.chat.id;
    const studentId = match[1]?.trim();

    if (!studentId) {
      await bot.sendMessage(
        chatId,
        '👋 Welcome to Student Fees Management Bot!\n\n' +
          'To get started, please use:\n' +
          '/start YOUR_STUDENT_ID\n\n' +
          'Example: /start STU2024001\n\n' +
          'Use /help to see all available commands.'
      );
      return;
    }

    try {
      // Find student by student ID
      const student = await Student.findOne({
        where: { studentId },
        include: [{ model: User, as: 'user' }],
      });

      if (!student) {
        await bot.sendMessage(
          chatId,
          '❌ Student ID not found. Please check your ID and try again.\n\n' +
            'Contact the administration if you need help.'
        );
        return;
      }

      // Update student's Telegram info
      await student.update({
        telegramChatId: chatId.toString(),
        telegramUsername: msg.from.username || null,
      });

      const miniAppUrl =
        process.env.MINI_APP_URL ||
        process.env.CLIENT_URL ||
        'http://localhost:5173';

      await bot.sendMessage(
        chatId,
        `✅ Successfully linked!\n\n` +
          `👤 Name: ${student.user.firstName} ${student.user.lastName}\n` +
          `🆔 Student ID: ${student.studentId}\n` +
          `📚 Class: ${student.class || 'N/A'}\n` +
          `🏛️ Department: ${student.department || 'N/A'}\n\n` +
          `Available commands:\n` +
          `/fees - View your fee details\n` +
          `/payments - View payment history\n` +
          `/pay - Make a payment\n` +
          `/miniapp - Open Student Portal\n` +
          `/help - Show all commands`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🌐 Open Student Portal',
                  web_app: { url: miniAppUrl },
                },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.error('Error in /start command:', error);
      await bot.sendMessage(
        chatId,
        '❌ An error occurred. Please try again later.'
      );
    }
  });

  // /fees command - View all fees
  bot.onText(/\/fees/, async (msg) => {
    console.log('Received /fees command from', msg.chat.id);
    const chatId = msg.chat.id;

    try {
      const student = await Student.findOne({
        where: { telegramChatId: chatId.toString() },
        include: [{ model: User, as: 'user' }],
      });

      if (!student) {
        await sendNotLinkedMessage(chatId);
        return;
      }

      const feeAssignments = await FeeAssignment.findAll({
        where: { studentId: student.id },
        include: [
          {
            model: FeeStructure,
            as: 'feeStructure',
            where: { isActive: true },
          },
        ],
        order: [['dueDate', 'ASC']],
      });

      if (feeAssignments.length === 0) {
        await bot.sendMessage(
          chatId,
          '📋 You have no fee assignments at this time.'
        );
        return;
      }

      let message = '💰 Your Fee Details:\n\n';
      let totalAmount = 0;
      let totalPaid = 0;

      feeAssignments.forEach((assignment, index) => {
        const balance = parseFloat(assignment.balanceAmount);
        totalAmount += parseFloat(assignment.totalAmount);
        totalPaid += parseFloat(assignment.paidAmount);

        message += `${index + 1}. ${assignment.feeStructure.name}\n`;
        message += `   📊 Total: ${formatCurrency(assignment.totalAmount)}\n`;
        message += `   ✅ Paid: ${formatCurrency(assignment.paidAmount)}\n`;
        message += `   💵 Balance: ${formatCurrency(assignment.balanceAmount)}\n`;
        message += `   📅 Due: ${new Date(
          assignment.dueDate
        ).toLocaleDateString()}\n`;
        message += `   Status: ${getStatusEmoji(
          assignment.status
        )} ${assignment.status.toUpperCase()}\n\n`;
      });

      const totalBalance = totalAmount - totalPaid;
      message += `\n📊 Summary:\n`;
      message += `Total Amount: ${formatCurrency(totalAmount)}\n`;
      message += `Total Paid: ${formatCurrency(totalPaid)}\n`;
      message += `Total Balance: ${formatCurrency(totalBalance)}`;

      await bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error in /fees command:', error);
      await bot.sendMessage(
        chatId,
        '❌ An error occurred while fetching your fees.'
      );
    }
  });

  // /payments command - View payment history
  bot.onText(/\/payments/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const student = await Student.findOne({
        where: { telegramChatId: chatId.toString() },
      });

      if (!student) {
        await sendNotLinkedMessage(chatId);
        return;
      }

      const payments = await Payment.findAll({
        where: { studentId: student.id },
        order: [['paymentDate', 'DESC']],
        limit: 10,
      });

      if (payments.length === 0) {
        await bot.sendMessage(chatId, '📋 You have no payment history yet.');
        return;
      }

      let message = '📊 Recent Payments (Last 10):\n\n';

      payments.forEach((payment, index) => {
        message += `${index + 1}. ${formatCurrency(payment.amount)}\n`;
        message += `   📅 Date: ${new Date(
          payment.paymentDate
        ).toLocaleDateString()}\n`;
        message += `   💳 Method: ${payment.paymentMethod}\n`;
        message += `   🧾 Receipt: ${payment.receiptNumber}\n`;
        message += `   Status: ${getStatusEmoji(
          payment.status
        )} ${payment.status.toUpperCase()}\n\n`;
      });

      await bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Error in /payments command:', error);
      await bot.sendMessage(
        chatId,
        '❌ An error occurred while fetching your payment history.'
      );
    }
  });

  // /pay command - Initiate payment
  bot.onText(/\/pay/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const student = await Student.findOne({
        where: { telegramChatId: chatId.toString() },
        include: [{ model: User, as: 'user' }],
      });

      if (!student) {
        await sendNotLinkedMessage(chatId);
        return;
      }

      const feeAssignments = await FeeAssignment.findAll({
        where: {
          studentId: student.id,
          status: ['pending', 'partial'],
        },
        include: [
          {
            model: FeeStructure,
            as: 'feeStructure',
            where: { isActive: true },
          },
        ],
      });

      if (feeAssignments.length === 0) {
        await bot.sendMessage(chatId, '✅ You have no pending fees to pay!');
        return;
      }

      let message = '💳 Choose a fee to pay:\n\n';
      const inlineKeyboard = [];

      feeAssignments.forEach((assignment, index) => {
        message += `${index + 1}. ${assignment.feeStructure.name}\n`;
        message += `   Balance: ${formatCurrency(assignment.balanceAmount)}\n\n`;
        
        inlineKeyboard.push([{
          text: `💳 Pay: ${assignment.feeStructure.name}`,
          callback_data: `PAY_FEE_${assignment.id}`
        }]);
      });

      await bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      });
    } catch (error) {
      console.error('Error in /pay command:', error);
      await bot.sendMessage(
        chatId,
        '❌ An error occurred while processing your request.'
      );
    }
  });

  // /help command
  bot.onText(/\/help/, async (msg) => {
    console.log('Received /help command from', msg.chat.id);
    const chatId = msg.chat.id;

    const helpMessage =
      '📚 Available Commands:\n\n' +
      '/start <student_id> - Link your account\n' +
      '/fees - View your fee details\n' +
      '/payments - View payment history\n' +
      '/pay - Make a payment\n' +
      '/miniapp - Open Student Portal\n' +
      '/help - Show this help message\n\n' +
      'Need assistance? Contact the administration office.';

    await bot.sendMessage(chatId, helpMessage);
  });

  // /miniapp command - Open Mini App
  bot.onText(/\/miniapp/, async (msg) => {
    console.log('Received /miniapp command from', msg.chat.id);
    const chatId = msg.chat.id;

    try {
      const student = await Student.findOne({
        where: { telegramChatId: chatId.toString() },
        include: [{ model: User, as: 'user' }],
      });

      if (!student) {
        await sendNotLinkedMessage(chatId);
        return;
      }

      const miniAppUrl =
        process.env.MINI_APP_URL ||
        process.env.CLIENT_URL ||
        'http://localhost:5173';

      await bot.sendMessage(
        chatId,
        `👋 Hi ${student.user.firstName}!\n\n` +
          `Click the button below to open your Student Portal:`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🌐 Open Student Portal',
                  web_app: { url: miniAppUrl },
                },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.error('Error in /miniapp command:', error);
      await bot.sendMessage(
        chatId,
        '❌ An error occurred. Please try again later.'
      );
    }
  });

  // /help command
  bot.onText(/\/help/, async (msg) => {
    console.log('Received /help command from', msg.chat.id);
    const chatId = msg.chat.id;

    const helpMessage =
      '📚 Available Commands:\n\n' +
      '/start <student_id> - Link your account\n' +
      '/fees - View your fee details\n' +
      '/payments - View payment history\n' +
      '/pay - Make a payment\n' +
      '/miniapp - Open Student Portal\n' +
      '/update_qr - Update the ABA QR Code (Admin only)\n' +
      '/help - Show this help message\n\n' +
      'Need assistance? Contact the administration office.';

    await bot.sendMessage(chatId, helpMessage);
  });

  // /update_qr command - Update the main QR code
  bot.onText(/\/update_qr/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Set state to wait for QR photo
    userPaymentState.set(chatId, { type: 'qr_upload' });
    
    await bot.sendMessage(
      chatId,
      '📸 **Upload ABA QR Code**\n\nPlease send the ABA QR code photo now. This will replace the current QR code used for all student payments.',
      { parse_mode: 'Markdown' }
    );
  });

  // Handle any other messages
  bot.on('message', async (msg) => {
    console.log('Received message:', msg.text || 'Photo', 'from', msg.chat.id);
    const chatId = msg.chat.id;
    const text = msg.text;

    // Check for photo upload first (for receipt or QR code update)
    if (msg.photo && msg.photo.length > 0) {
      const state = userPaymentState.get(chatId);
      
      if (state && state.type === 'qr_upload') {
        try {
          const photo = msg.photo[msg.photo.length - 1];
          await bot.sendMessage(chatId, '⏳ Saving your new QR code...');
          
          const uploadsDir = path.join(__dirname, '../../public/assets');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          const downloadedFilePath = await bot.downloadFile(photo.file_id, uploadsDir);
          const targetPath = path.join(uploadsDir, 'aba_qr.jpg');
          
          // Move and rename the downloaded file to aba_qr.jpg
          fs.renameSync(downloadedFilePath, targetPath);
          
          userPaymentState.delete(chatId);
          await bot.sendMessage(chatId, '✅ QR Code successfully updated! Students will now see this new QR code when they pay.', { parse_mode: 'Markdown' });
        } catch (error) {
          console.error('Error updating QR code:', error);
          await bot.sendMessage(chatId, '❌ Failed to save QR code.');
        }
        return;
      }
      
      if (state && state.type === 'payment') {
        try {
          const photo = msg.photo[msg.photo.length - 1]; // get highest resolution
          await bot.sendMessage(chatId, '⏳ Processing your receipt...');
          
          const uploadsDir = path.join(__dirname, '../../uploads/receipts');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          const downloadedFilePath = await bot.downloadFile(photo.file_id, uploadsDir);
          const receiptNumber = 'REC-BOT-' + Date.now();
          
          await Payment.create({
            studentId: state.studentId,
            feeAssignmentId: state.feeAssignmentId,
            amount: state.amount,
            paymentMethod: 'bank_transfer',
            receiptNumber: receiptNumber,
            receiptPath: downloadedFilePath,
            status: 'pending'
          });
          
          userPaymentState.delete(chatId);
          await bot.sendMessage(chatId, '✅ Receipt uploaded successfully!\n\nYour payment is now **Pending Verification** by the finance office. You will receive a confirmation once it is approved.', { parse_mode: 'Markdown' });
        } catch (error) {
          console.error('Error processing receipt photo:', error);
          await bot.sendMessage(chatId, '❌ Failed to process receipt. Please try again or contact support.');
        }
        return;
      }
    }

    // Ignore if it's a command
    if (text && text.startsWith('/')) {
      console.log('Ignoring command in generic handler:', text);
      return;
    }

    await bot.sendMessage(
      chatId,
      "I'm not sure how to respond to that. Use /help to see available commands."
    );
  });

  // Handle callback queries (Inline buttons)
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith('PAY_FEE_')) {
      const feeAssignmentId = data.replace('PAY_FEE_', '');
      
      try {
        const assignment = await FeeAssignment.findByPk(feeAssignmentId);

        if (!assignment) {
          await bot.sendMessage(chatId, '❌ Fee assignment not found.');
          return bot.answerCallbackQuery(query.id);
        }

        userPaymentState.set(chatId, {
          type: 'payment',
          feeAssignmentId: assignment.id,
          amount: assignment.balanceAmount,
          studentId: assignment.studentId
        });

        const bankDetails = `🏦 **Payment Details**\n\n` +
          `💰 Amount to Pay: **${formatCurrency(assignment.balanceAmount)}**\n\n` +
          `Please scan the ABA QR code above to make the transfer, then **upload a screenshot of the receipt here** as a photo reply.`;

        const qrImagePath = path.join(__dirname, '../../public/assets/aba_qr.jpg');
        
        if (fs.existsSync(qrImagePath)) {
          await bot.sendPhoto(chatId, qrImagePath, {
            caption: bankDetails,
            parse_mode: 'Markdown'
          });
        } else {
          await bot.sendMessage(chatId, `⚠️ **QR Code Missing**\n\nThe administrator has not uploaded the QR code yet. Please contact support.`, { parse_mode: 'Markdown' });
        }
      } catch (error) {
        console.error('Error handling payment callback:', error);
        await bot.sendMessage(chatId, '❌ An error occurred.');
      }
    }
    
    bot.answerCallbackQuery(query.id).catch(console.error);
  });

  console.log('Bot handlers setup complete');
};

// Send fee alert notification
const sendFeeAlert = async (studentId, message) => {
  try {
    const student = await Student.findByPk(studentId);

    if (!student || !student.telegramChatId) {
      return { success: false, message: 'Student not linked to Telegram' };
    }

    await bot.sendMessage(student.telegramChatId, `🔔 ${message}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending fee alert:', error);
    return { success: false, message: error.message };
  }
};

// Send payment confirmation
const sendPaymentConfirmation = async (studentId, paymentDetails) => {
  try {
    const student = await Student.findByPk(studentId);

    if (!student || !student.telegramChatId) {
      return { success: false, message: 'Student not linked to Telegram' };
    }

    const message =
      '✅ Payment Confirmed!\n\n' +
      `💰 Amount: ${formatCurrency(paymentDetails.amount)}\n` +
      `🧾 Receipt: ${paymentDetails.receiptNumber}\n` +
      `📅 Date: ${new Date(
        paymentDetails.paymentDate
      ).toLocaleDateString()}\n` +
      `💳 Method: ${paymentDetails.paymentMethod}\n\n` +
      'Thank you for your payment!';

    await bot.sendMessage(student.telegramChatId, message);
    return { success: true };
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return { success: false, message: error.message };
  }
};

// Send due date reminder
const sendDueDateReminder = async (studentId, feeDetails) => {
  try {
    const student = await Student.findByPk(studentId);

    if (!student || !student.telegramChatId) {
      return { success: false, message: 'Student not linked to Telegram' };
    }

    const daysUntilDue = Math.ceil(
      (new Date(feeDetails.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    const message =
      '⏰ Payment Reminder\n\n' +
      `📋 Fee: ${feeDetails.feeName}\n` +
      `💵 Amount Due: ${formatCurrency(feeDetails.balance)}\n` +
      `📅 Due Date: ${new Date(feeDetails.dueDate).toLocaleDateString()}\n` +
      `⏳ Days Remaining: ${daysUntilDue}\n\n` +
      'Please make your payment before the due date to avoid late fees.';

    await bot.sendMessage(student.telegramChatId, message);
    return { success: true };
  } catch (error) {
    console.error('Error sending due date reminder:', error);
    return { success: false, message: error.message };
  }
};

// Helper function to send not linked message
const sendNotLinkedMessage = async (chatId) => {
  await bot.sendMessage(
    chatId,
    '❌ Your account is not linked.\n\n' +
      'Please use:\n' +
      '/start YOUR_STUDENT_ID\n\n' +
      'Example: /start STU2024001'
  );
};

// Helper function to get status emoji
const getStatusEmoji = (status) => {
  const emojiMap = {
    pending: '⏳',
    partial: '📊',
    paid: '✅',
    overdue: '⚠️',
    completed: '✅',
    cancelled: '❌',
  };
  return emojiMap[status] || '❓';
};

// Get bot instance
const getBot = () => bot;

module.exports = {
  initBot,
  getBot,
  sendFeeAlert,
  sendPaymentConfirmation,
  sendDueDateReminder,
};
