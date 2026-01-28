# Telegram Bot Integration for Student Fees Management

This document explains how to set up and use the Telegram bot for student fee management and payments.

## Features

The Telegram bot provides the following features for students:

- **Account Linking**: Students can link their account using their student ID
- **Fee Information**: View all assigned fees, amounts due, and due dates
- **Payment History**: Check recent payment transactions
- **Payment Initiation**: Get links to make payments online
- **Automatic Notifications**:
  - Payment confirmations
  - Due date reminders (7, 3, and 1 day before)
  - Overdue fee alerts

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Start a chat and send `/newbot`
3. Follow the instructions:
   - Choose a name for your bot (e.g., "Student Fees Management Bot")
   - Choose a username (must end with 'bot', e.g., "StudentFeesBot")
4. BotFather will provide you with a **Bot Token**. Save this token securely.

### 2. Configure the Server

1. Add the bot token to your `.env` file:

   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

2. Make sure the `CLIENT_URL` is set correctly for payment redirects:

   ```
   CLIENT_URL=http://localhost:5173
   ```

3. Restart the server to initialize the bot

### 3. Update Student Records

Students need to have their Telegram chat ID linked to their account. This happens automatically when they use the `/start` command.

## Student Usage Guide

### Getting Started

1. Open Telegram and search for your bot (using the username you created)
2. Start the bot with: `/start YOUR_STUDENT_ID`
   - Example: `/start STU2024001`
3. The bot will confirm your registration and show available commands

### Available Commands

| Command               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `/start <student_id>` | Link your student account to Telegram             |
| `/fees`               | View all your fee details, amounts, and due dates |
| `/payments`           | View your payment history (last 10 transactions)  |
| `/pay`                | Get information on how to make a payment          |
| `/help`               | Show all available commands                       |

### Example Conversations

**Linking Account:**

```
You: /start STU2024001
Bot: ✅ Successfully linked!
     👤 Name: John Doe
     🆔 Student ID: STU2024001
     📚 Class: Grade 10
     🏛️ Department: Science
     ...
```

**Checking Fees:**

```
You: /fees
Bot: 💰 Your Fee Details:

     1. Tuition Fee
        📊 Total: $5000.00
        ✅ Paid: $2000.00
        💵 Balance: $3000.00
        📅 Due: 12/31/2025
        Status: ⏳ PARTIAL
     ...
```

**Payment History:**

```
You: /payments
Bot: 📊 Recent Payments (Last 10):

     1. $1000.00
        📅 Date: 12/15/2025
        💳 Method: credit_card
        🧾 Receipt: RCP-20251215-001
        Status: ✅ COMPLETED
     ...
```

## Admin Functions

Admins and accountants can send notifications to students via the API:

### Send Individual Alert

```bash
POST /api/telegram/send-alert
{
  "studentId": "uuid-here",
  "message": "Your tuition fee is due in 3 days"
}
```

### Send Bulk Alerts

```bash
POST /api/telegram/send-bulk-alerts
{
  "studentIds": ["uuid1", "uuid2", "uuid3"],
  "message": "Reminder: Semester fees due by end of month"
}
```

### View Linked Students

```bash
GET /api/telegram/linked-students
```

### Unlink Student

```bash
POST /api/telegram/unlink-student/:studentId
```

## Automatic Notifications

The system automatically sends notifications for:

1. **Payment Confirmations**: Sent immediately after a successful payment
2. **Due Date Reminders**: Sent 7, 3, and 1 day before due dates
3. **Overdue Alerts**: Sent daily for overdue fees

## Troubleshooting

### Bot Not Responding

- Check if the `TELEGRAM_BOT_TOKEN` is correct in `.env`
- Verify the server is running and the bot is initialized
- Check server logs for errors

### Student Can't Link Account

- Verify the student ID exists in the database
- Ensure the student ID is entered correctly (case-sensitive)
- Check if the student is already linked to another Telegram account

### Notifications Not Received

- Verify the student has linked their Telegram account
- Check if the notification scheduler is running
- Review server logs for delivery errors

## Security Considerations

1. **Bot Token**: Never share your bot token publicly or commit it to version control
2. **Student Verification**: Students must know their correct student ID to link
3. **Data Privacy**: Only the student can access their own fee information
4. **Admin Access**: Admin endpoints require authentication

## Migration from Web Interface

Since students no longer use the web interface for their dashboard:

1. All existing students should be notified about the Telegram bot
2. Provide clear instructions on how to link their accounts
3. Keep the web payment gateway functional for those who prefer it
4. Consider sending initial Telegram invitations via email

## Support

For students having issues:

1. Contact the administration office
2. Verify student ID and active status
3. Check email for instructions and bot username

For technical issues:

- Check server logs: `npm run dev` or view console output
- Verify database connection
- Test bot token with BotFather
