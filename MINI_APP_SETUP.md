# Telegram Mini App Setup Guide

## Prerequisites

1. Your bot token: `8292439675:AAEf7rmr0IW6eoqAAFl_Ji7rHIDyKng_mkg`
2. Frontend running on: http://localhost:5173
3. Backend running on: http://localhost:5000

## Step 1: Install ngrok (For Development)

Download ngrok from: https://ngrok.com/download

Or install via Chocolatey:

```powershell
choco install ngrok
```

## Step 2: Expose Frontend via HTTPS

Open a new terminal and run:

```powershell
ngrok http 5173
```

You'll get a URL like: `https://xxxx-xxx-xxx-xxx.ngrok-free.app`

**Copy this URL - you'll need it!**

## Step 3: Get Your Bot Username

1. Open Telegram and message @BotFather
2. Send: `/mybots`
3. Select your bot
4. Note your bot username (e.g., `YourSchoolFeesBot`)

## Step 4: Set Mini App URL with BotFather

1. Message @BotFather on Telegram
2. Send: `/setminiapp`
3. Select your bot
4. Paste your ngrok URL: `https://xxxx-xxx-xxx-xxx.ngrok-free.app`
5. BotFather will confirm the Mini App URL is set

## Step 5: Mini App Links

Once configured, you can access your Mini App via:

### Direct Mini App Link:

```
https://t.me/YOUR_BOT_USERNAME/app
```

Replace `YOUR_BOT_USERNAME` with your actual bot username.

### Or open from bot chat:

```
https://t.me/YOUR_BOT_USERNAME?startapp
```

## Step 6: Update Bot to Send Mini App Button

The bot can also send an inline button that opens the Mini App directly.

## For Production

For production deployment:

1. Deploy frontend to a hosting service (Vercel, Netlify, etc.)
2. Get the production HTTPS URL
3. Use that URL instead of ngrok
4. Set the production URL with @BotFather using `/setminiapp`

## Testing

1. Start ngrok: `ngrok http 5173`
2. Copy the HTTPS URL
3. Set it with @BotFather: `/setminiapp`
4. Open Mini App: `https://t.me/YOUR_BOT_USERNAME/app`

## Note

- ngrok URLs change each time you restart ngrok (free version)
- For permanent solution, deploy to a real hosting service
- Mini Apps require HTTPS - localhost won't work in production
