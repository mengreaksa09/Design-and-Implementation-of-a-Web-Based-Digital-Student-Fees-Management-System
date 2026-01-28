# 🚀 Telegram Mini App - Quick Start Guide

## ✅ What's Been Configured

Your Telegram bot now includes **Mini App buttons** that open the web interface directly within Telegram!

## 📱 How to Use the Mini App

### Step 1: Find Your Bot Username

1. Open Telegram and message **@BotFather**
2. Send: `/mybots`
3. Select your bot
4. Click **"API Token"** to see your bot details
5. Your bot username is shown (e.g., `YourSchoolFeesBot`)

### Step 2: Set Up ngrok (For Development Testing)

Since Telegram Mini Apps require **HTTPS**, you need to expose your local server:

#### Install ngrok:

```powershell
# Download from: https://ngrok.com/download
# Or install via Chocolatey:
choco install ngrok
```

#### Start ngrok:

```powershell
ngrok http 5173
```

#### Copy the HTTPS URL:

You'll see something like:

```
Forwarding  https://1234-5678-90ab-cdef.ngrok-free.app -> http://localhost:5173
```

**Copy the HTTPS URL!**

### Step 3: Configure Mini App with BotFather

1. Message **@BotFather** on Telegram
2. Send: `/setminiapp`
3. Select your bot
4. **Send your ngrok URL** (e.g., `https://1234-5678-90ab-cdef.ngrok-free.app`)
5. BotFather confirms: "Success! Mini app URL has been updated"

### Step 4: Update Your .env File

Open `server/.env` and update:

```env
MINI_APP_URL=https://1234-5678-90ab-cdef.ngrok-free.app
```

### Step 5: Restart Backend Server

Stop and restart your server to apply the new URL:

```powershell
# Stop existing processes
Get-Process -Name node | Stop-Process -Force

# Start backend
cd server
npm start

# Start frontend (in another terminal)
cd client
npm run dev

# Start ngrok (in another terminal)
ngrok http 5173
```

## 🎯 Testing the Mini App

### Method 1: Direct Mini App Link

```
https://t.me/YOUR_BOT_USERNAME/app
```

Replace `YOUR_BOT_USERNAME` with your actual bot username.

### Method 2: Open via Bot Chat

1. Open your bot in Telegram
2. Send: `/start`
3. Click the **🌐 Open Web App** button
4. The web interface opens inside Telegram!

### Method 3: After Student Registration

1. Send: `/start STU001` (with your actual student ID)
2. Bot shows welcome message with buttons:
   - **🌐 Open My Dashboard** - Opens student dashboard
   - **💰 View My Fees** - Shows fee information
   - **💳 Make Payment** - Payment interface
   - **📜 Payment History** - Past transactions

## 🔍 What Students Will See

When students click **"Open My Dashboard"**:

- ✅ Opens the web interface **inside Telegram**
- ✅ Auto-authenticated (via Telegram ID)
- ✅ Full access to dashboard, fees, payments
- ✅ No need to remember separate login credentials
- ✅ Seamless experience within Telegram app

## 🌐 Mini App Links Summary

| Type                     | URL Format                            | Description          |
| ------------------------ | ------------------------------------- | -------------------- |
| **Direct Mini App**      | `https://t.me/BOT_USERNAME/app`       | Opens main app       |
| **With Start Parameter** | `https://t.me/BOT_USERNAME?startapp`  | Opens with parameter |
| **Specific Page**        | Buttons send to: `/student/dashboard` | Opens specific page  |

## 📝 Important Notes

### For Development:

- ✅ ngrok URLs change every restart (free version)
- ✅ Must update `MINI_APP_URL` in .env each time
- ✅ Must restart backend server after URL change
- ✅ Keep 3 terminals running: backend, frontend, ngrok

### For Production:

1. Deploy frontend to hosting service (Vercel, Netlify, etc.)
2. Get permanent HTTPS URL (e.g., `https://yourschool.vercel.app`)
3. Set that URL with @BotFather: `/setminiapp`
4. Update `MINI_APP_URL` in production .env
5. No need for ngrok in production!

## 🎨 Current Features

### Bot Commands with Mini App Buttons:

- `/start` - Shows "Open Web App" button
- `/start STU001` - Shows "Open My Dashboard" + action buttons
- `/fees` - View fees with quick actions
- `/payments` - Payment history
- `/help` - Help information

### Mini App Integration:

- ✅ Opens web interface in Telegram
- ✅ Inline keyboard buttons for navigation
- ✅ Seamless user experience
- ✅ No external browser needed

## 🔧 Troubleshooting

### "Mini App Not Opening"

- ✅ Ensure ngrok is running
- ✅ Check `MINI_APP_URL` matches ngrok URL
- ✅ Restart backend server after .env changes
- ✅ Use HTTPS URL (not HTTP)

### "Telegram Shows Error"

- ✅ Verify URL is set with @BotFather
- ✅ Test URL in browser first
- ✅ Check frontend is running on correct port
- ✅ Ensure ngrok tunnel is active

### "Buttons Not Showing"

- ✅ Update to latest bot version
- ✅ Clear Telegram cache
- ✅ Test with `/start` command again

## 🎉 Success Checklist

- [ ] ngrok installed and running
- [ ] HTTPS URL obtained from ngrok
- [ ] Mini App URL set with @BotFather
- [ ] `.env` updated with `MINI_APP_URL`
- [ ] Backend server restarted
- [ ] Frontend running on port 5173
- [ ] Bot tested with `/start` command
- [ ] Mini App opens inside Telegram
- [ ] Student can access dashboard via Mini App

## 🚀 Next Steps

1. **Test locally** with ngrok
2. **Deploy to production** hosting
3. **Update permanent URL** with @BotFather
4. **Distribute bot link** to students
5. **Monitor usage** through admin panel

---

**Your bot is now a fully functional Mini App!** 🎉

Students can access everything from within Telegram without leaving the app.
