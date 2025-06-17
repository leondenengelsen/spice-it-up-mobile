# 📋 Copy-Paste Guide for Render Environment Variables

## ✅ **What to Copy Directly from Your .env File**

You can copy these **exactly as they are**:

```
OPENAI_API_KEY=sk-proj-3-gjVKIXauvOhusX6LZoD0fyjakNisGjn6ISXk6IsFLlW-w7bQO8hmdvF7WgZ1mxq96poiPHFCT3BlbkFJyy
GEMINI_API_KEY=AIzaSyCfwGYDftwmFO2fxclnpO2tcyqmzv8jC-s
DB_NAME=spice_db
```

---

## 🔄 **What to Change for Render**

### **Database Connection** (Change these):
```
# FROM your .env file:
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=spice_user
DB_PASSWORD=spicepass

# TO Render (replace with your actual Render MySQL details):
DB_HOST=your-mysql-host.render.com
DB_PORT=3306
DB_USER=your-render-db-username
DB_PASSWORD=your-render-db-password
```

### **Port** (Change this):
```
# FROM your .env file:
PORT=3000

# TO Render:
PORT=10000
```

---

## ➕ **What to Add for Render**

Add this new variable:
```
NODE_ENV=production
```

---

## ❌ **What to Skip (Don't Copy)**

Skip these - they're for local Docker setup:
```
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=spice_db
MYSQL_USER=spice_user
MYSQL_PASSWORD=spicepass
```

---

## 📝 **Final List for Render**

Copy this exact list into Render:

```
NODE_ENV=production
PORT=10000
DB_HOST=your-mysql-host.render.com
DB_PORT=3306
DB_USER=your-render-db-username
DB_PASSWORD=your-render-db-password
DB_NAME=spice_db
OPENAI_API_KEY=sk-proj-3-gjVKIXauvOhusX6LZoD0fyjakNisGjn6ISXk6IsFLlW-w7bQO8hmdvF7WgZ1mxq96poiPHFCT3BlbkFJyy
GEMINI_API_KEY=AIzaSyCfwGYDftwmFO2fxclnpO2tcyqmzv8jC-s
```

---

## 🎯 **Summary**

- **Copy**: API keys and database name
- **Change**: Database host, port, user, password, and app port
- **Add**: NODE_ENV=production
- **Skip**: MySQL root password and local Docker variables

That's it! Much simpler than the complex list I gave you earlier. 