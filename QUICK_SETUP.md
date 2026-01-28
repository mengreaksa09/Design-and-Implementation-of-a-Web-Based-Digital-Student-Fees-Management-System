# Quick Setup Guide - Telegram Bot Integration

## ⚠️ Important: Database Schema Update Required

The new Telegram features require database schema changes. Follow these steps:

### Option 1: Using Database Sync (Recommended for Development)

1. **Stop the server** if it's currently running (Ctrl+C in the terminal)

2. **Temporarily enable force sync** to update the database schema:

   - Open `server/src/index.js`
   - Find this line: `.sync({ force: false })`
   - Change it to: `.sync({ force: true, alter: true })`

   **⚠️ WARNING**: `force: true` will drop all existing tables and recreate them. Use `alter: true` for safer column additions in development.

3. **Restart the server**:

   ```bash
   cd server
   npm run dev
   ```

4. **After the database syncs, change it back**:
   - Open `server/src/index.js`
   - Change back to: `.sync({ force: false })`

### Option 2: Manual SQL Update (Safer for Production)

Run this SQL command on your database:

```sql
ALTER TABLE students
ADD COLUMN telegramChatId VARCHAR(255) UNIQUE,
ADD COLUMN telegramUsername VARCHAR(255);
```

## Setting Up the Telegram Bot

### Step 1: Create Your Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send: `/newbot`
3. Follow the instructions:
   - **Bot name**: "StudentFeesBot" (or any name you prefer)
   - **Username**: "YourSchool_Fees_Bot" (must end with 'bot')
4. BotFather will give you a **token** like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
5. **Copy this token** - you'll need it next

### Step 2: Configure Your Server

1. Open `server/.env` file
2. Find the line: `TELEGRAM_BOT_TOKEN=`
3. Add your token: `TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
4. Save the file

### Step 3: Restart the Server

```bash
cd server
npm run dev
```

You should see in the console:

```
Telegram bot initialized successfully
Bot handlers setup complete
Telegram notification scheduler started
```

### Step 4: Test the Bot

1. **Find your bot** on Telegram (search for the username you created)
2. **Link a test student account**:
   - Send: `/start STU2024001` (replace with an actual student ID from your database)
   - The bot should respond with student information
3. **Test commands**:
   - `/fees` - View fees
   - `/payments` - View payment history
   - `/help` - See all commands

## Accessing the New Features

### Admin Dashboard

1. Log in as Admin or Accountant
2. You'll see a new menu item: **"Telegram Bot"**
3. Click it to access the Telegram Notifications page
4. From here you can:
   - View all students linked to Telegram
   - Send individual or bulk notifications
   - Unlink students if needed

### User Management

- The **Users** page now only shows Admin and Accountant roles
- Students are managed separately and interact via Telegram bot

## Testing Checklist

- [ ] Database schema updated successfully
- [ ] Server starts without errors
- [ ] Telegram bot responds to `/start` command
- [ ] Bot displays student fees with `/fees`
- [ ] Bot shows payment history with `/payments`
- [ ] Admin can access Telegram Notifications page
- [ ] Admin can send test notification to linked student
- [ ] Payment notification is sent via Telegram after payment
- [ ] User Management page only shows Admin/Accountant

## Troubleshooting

### Bot not responding

- Check if `TELEGRAM_BOT_TOKEN` is set correctly in `.env`
- Verify the server console shows "Telegram bot initialized successfully"
- Make sure the bot token is from @BotFather and not expired

### Database errors

- Run the ALTER TABLE command manually if auto-sync fails
- Check if columns `telegramChatId` and `telegramUsername` exist in students table

### Student can't link

- Verify the student ID exists in the database
- Check if student is already linked (only one Telegram per student)
- Ensure student status is 'active'

### Server won't start

- Check all syntax errors in new files
- Verify `node-telegram-bot-api` is installed: `npm list node-telegram-bot-api`
- Look for error messages in the console

## What's Changed

### Frontend (Client)

- ✅ UserManagement page updated (Admin/Accountant only)
- ✅ New TelegramNotifications page added
- ✅ Navigation menu updated with Telegram Bot link

### Backend (Server)

- ✅ Student model updated with Telegram fields
- ✅ Telegram bot service created
- ✅ Notification scheduler service created
- ✅ Telegram API routes added
- ✅ Payment routes updated to send Telegram notifications
- ✅ Server startup includes bot initialization

## Next Steps

1. **Create your bot** with @BotFather
2. **Add token** to `.env` file
3. **Update database** schema
4. **Restart server**
5. **Test with a student** account
6. **Notify all students** about the new Telegram bot

## Documentation

- Full setup guide: `TELEGRAM_BOT_SETUP.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`

## Support

If you encounter any issues:

1. Check the server console for error messages
2. Verify environment variables are set correctly
3. Ensure database schema is updated
4. Test with a valid student ID from the database

---

**Important**: Remember to change `sync({ force: true })` back to `sync({ force: false })` after the initial database update to prevent accidental data loss!
