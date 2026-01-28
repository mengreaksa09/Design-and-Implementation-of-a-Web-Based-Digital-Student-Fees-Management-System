const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Email templates
const emailTemplates = {
  paymentConfirmation: (data) => ({
    subject: 'Payment Confirmation - Fee Receipt',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
          <h1>${process.env.SCHOOL_NAME || 'Student Fees Management'}</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Payment Confirmation</h2>
          <p>Dear ${data.studentName},</p>
          <p>Your payment has been received successfully.</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Receipt Number:</strong> ${data.receiptNumber}</p>
            <p><strong>Amount Paid:</strong> ${data.currency} ${data.amount}</p>
            <p><strong>Fee Type:</strong> ${data.feeType}</p>
            <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
            <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          </div>
          <p>Thank you for your payment.</p>
          <p>Best regards,<br>${
            process.env.SCHOOL_NAME || 'Finance Department'
          }</p>
        </div>
        <div style="background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; font-size: 12px;">
          <p>${process.env.SCHOOL_ADDRESS || ''}</p>
          <p>Phone: ${process.env.SCHOOL_PHONE || ''} | Email: ${
      process.env.SCHOOL_EMAIL || ''
    }</p>
        </div>
      </div>
    `,
  }),

  feeReminder: (data) => ({
    subject: 'Fee Due Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F59E0B; color: white; padding: 20px; text-align: center;">
          <h1>Fee Due Reminder</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <p>Dear ${data.studentName},</p>
          <p>This is a reminder that you have pending fees due.</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Fee Type:</strong> ${data.feeType}</p>
            <p><strong>Amount Due:</strong> ${data.currency} ${data.amount}</p>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
          </div>
          <p>Please make the payment at your earliest convenience to avoid late fees.</p>
          <a href="${
            process.env.CLIENT_URL
          }/student/payments" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Pay Now</a>
          <p style="margin-top: 20px;">Best regards,<br>${
            process.env.SCHOOL_NAME || 'Finance Department'
          }</p>
        </div>
      </div>
    `,
  }),

  overdueWarning: (data) => ({
    subject: 'URGENT: Overdue Fee Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #DC2626; color: white; padding: 20px; text-align: center;">
          <h1>⚠️ Overdue Fee Notice</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <p>Dear ${data.studentName},</p>
          <p style="color: #DC2626;"><strong>Your fee payment is now overdue.</strong></p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
            <p><strong>Fee Type:</strong> ${data.feeType}</p>
            <p><strong>Original Amount:</strong> ${data.currency} ${
      data.originalAmount
    }</p>
            <p><strong>Late Fee:</strong> ${data.currency} ${data.lateFee}</p>
            <p><strong>Total Due:</strong> ${data.currency} ${
      data.totalAmount
    }</p>
            <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
          </div>
          <p>Please make the payment immediately to avoid further penalties.</p>
          <a href="${
            process.env.CLIENT_URL
          }/student/payments" style="display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Pay Now</a>
          <p style="margin-top: 20px;">Best regards,<br>${
            process.env.SCHOOL_NAME || 'Finance Department'
          }</p>
        </div>
      </div>
    `,
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
          <h1>Password Reset</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <p>Dear ${data.name},</p>
          <p>You have requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              data.resetLink
            }" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>${
            process.env.SCHOOL_NAME || 'System Administrator'
          }</p>
        </div>
      </div>
    `,
  }),

  welcomeEmail: (data) => ({
    subject: `Welcome to ${
      process.env.SCHOOL_NAME || 'Student Fees Management System'
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
          <h1>Welcome!</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <p>Dear ${data.name},</p>
          <p>Your account has been created successfully.</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Role:</strong> ${data.role}</p>
            ${
              data.studentId
                ? `<p><strong>Student ID:</strong> ${data.studentId}</p>`
                : ''
            }
          </div>
          <a href="${
            process.env.CLIENT_URL
          }/login" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Login Now</a>
          <p style="margin-top: 20px;">Best regards,<br>${
            process.env.SCHOOL_NAME || 'System Administrator'
          }</p>
        </div>
      </div>
    `,
  }),
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](data);

    const mailOptions = {
      from: `"${process.env.SCHOOL_NAME || 'Student Fees'}" <${
        process.env.EMAIL_FROM || process.env.SMTP_USER
      }>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = { sendEmail, verifyEmailConfig, emailTemplates };
