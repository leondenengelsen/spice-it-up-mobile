# 🔧 Render Environment Variables - Simplified

## 📋 Essential Environment Variables for Render

Based on your existing `.env` file, here are the **essential** variables you need to configure in Render:

---

## 🌐 **Core Variables**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `PORT` | `10000` | Port for Render (they set this automatically) |
| `NODE_ENV` | `production` | Environment mode |

---

## 🗄️ **Database Variables**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `DB_HOST` | `your-mysql-host.render.com` | Your Render MySQL database host |
| `DB_PORT` | `3306` | Database port |
| `DB_USER` | `your-db-username` | Database username |
| `DB_PASSWORD` | `your-db-password` | Database password |
| `DB_NAME` | `spice_db` | Database name |

---

## 🤖 **AI API Keys**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `OPENAI_API_KEY` | `sk-proj-3-gjVKIXauvOhusX6LZoD0fyjakNisGjn6ISXk6IsFLlW-w7bQO8hmdvF7WgZ1mxq96poiPHFCT3BlbkFJyy` | Your OpenAI API key |
| `GEMINI_API_KEY` | `AIzaSyCfwGYDftwmFO2fxclnpO2tcyqmzv8jC-s` | Your Google Gemini API key |

---

## 🔥 **Firebase (Optional for Render)**

Your Firebase configuration is handled via the service account JSON file in your codebase, so you don't need additional environment variables for Firebase in Render.

---

## 🚀 **How to Set Up in Render**

1. **Go to your Render dashboard**
2. **Select your backend service**
3. **Go to "Environment" tab**
4. **Add these variables one by one:**

```
PORT=10000
NODE_ENV=production
DB_HOST=your-mysql-host.render.com
DB_PORT=3306
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=spice_db
OPENAI_API_KEY=sk-proj-3-gjVKIXauvOhusX6LZoD0fyjakNisGjn6ISXk6IsFLlW-w7bQO8hmdvF7WgZ1mxq96poiPHFCT3BlbkFJyy
GEMINI_API_KEY=AIzaSyCfwGYDftwmFO2fxclnpO2tcyqmzv8jC-s
```

---

## 📝 **Notes**

- **Your `.env` file is for local development** - it's referenced in your `docker-compose.yml`
- **Render uses environment variables** instead of `.env` files
- **The service account JSON files** are already in your codebase and will work on Render
- **You only need to change the database connection** to point to your Render MySQL database

---

## ✅ **That's it!**

Much simpler than the previous list. You just need to:
1. Copy your API keys from your `.env` file
2. Set up your Render MySQL database connection details
3. Set `NODE_ENV=production`

The rest (Firebase, service accounts, etc.) will work automatically from your existing codebase. 