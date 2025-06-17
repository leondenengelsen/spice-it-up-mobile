# 🔧 Render Environment Variables Configuration

## 📋 Complete List of Environment Variables for Render Deployment

Below is the complete list of environment variables you need to configure in your Render backend service. These are extracted from your codebase and are required for proper functionality.

---

## 🌐 **Core Application Variables**

| Variable Name | Value | Description | Required |
|---------------|-------|-------------|----------|
| `NODE_ENV` | `production` | Environment mode | ✅ Yes |
| `PORT` | `10000` | Port for the application (Render default) | ✅ Yes |
| `HOST` | `0.0.0.0` | Host binding for all interfaces | ✅ Yes |

---

## 🗄️ **Database Configuration**

| Variable Name | Value | Description | Required |
|---------------|-------|-------------|----------|
| `DB_HOST` | `your-mysql-host.render.com` | MySQL database host | ✅ Yes |
| `DB_PORT` | `3306` | MySQL database port | ✅ Yes |
| `DB_USER` | `your-db-username` | MySQL database username | ✅ Yes |
| `DB_PASSWORD` | `your-db-password` | MySQL database password | ✅ Yes |
| `DB_NAME` | `spice_db` | MySQL database name | ✅ Yes |

---

## 🔥 **Firebase Configuration**

| Variable Name | Value | Description | Required |
|---------------|-------|-------------|----------|
| `FIREBASE_PROJECT_ID` | `gen-lang-client-0251517490` | Firebase project ID | ✅ Yes |

**Note**: Firebase service account credentials are handled via the JSON file in `backend/secrets/`

---

## 🤖 **AI Service API Keys**

| Variable Name | Value | Description | Required |
|---------------|-------|-------------|----------|
| `GEMINI_API_KEY` | `your-gemini-api-key` | Google Gemini API key | ✅ Yes |
| `OPENAI_API_KEY` | `your-openai-api-key` | OpenAI API key (fallback) | ✅ Yes |
| `GOOGLE_CLOUD_API_KEY` | `your-google-cloud-api-key` | Google Cloud API key | ✅ Yes |

---

## 🌍 **CORS Configuration**

| Variable Name | Value | Description | Required |
|---------------|-------|-------------|----------|
| `ADDITIONAL_CORS_ORIGINS` | `https://your-frontend-domain.netlify.app` | Additional CORS origins (comma-separated) | ❌ Optional |

---

## 🔐 **Security & Authentication**

| Variable Name | Value | Description | Required |
|---------------|-------|-------------|----------|
| `DOCKER_ENV` | `false` | Docker environment flag | ❌ Optional |

---

## 📁 **File Paths & Credentials**

### Google Cloud Service Account Files
Your application uses these service account files that need to be accessible:

1. **Firebase Admin SDK**: `backend/secrets/gen-lang-client-0251517490-firebase-adminsdk-fbsvc-2562b31be4.json`
2. **Google Cloud Speech**: `backend/secrets/gen-lang-client-0251517490-157aa58a7fda.json`

**Important**: These files contain sensitive credentials and should be handled securely.

---

## 🚀 **How to Configure in Render**

### Step 1: Access Environment Variables
1. Go to your Render dashboard
2. Select your backend service
3. Navigate to "Environment" tab
4. Click "Add Environment Variable"

### Step 2: Add Each Variable
Add each variable from the table above with the appropriate values.

### Step 3: Handle Service Account Files
For the Google Cloud service account files, you have two options:

#### Option A: Use Render's File System
1. Upload the JSON files to your Render service
2. Update the file paths in your code to point to the correct location

#### Option B: Use Environment Variables for Credentials
Convert the JSON content to environment variables:

```bash
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_TYPE=service_account
FIREBASE_SERVICE_ACCOUNT_PROJECT_ID=gen-lang-client-0251517490
FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=2562b31be4b14a757f5e345307753b6168724680
FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1wE0e/jZbQM3E\nHrsHFnvlmdRgabAujOeegzCud93Wrl0WeGX07dEuG7YdoZx8QLTOgjjnL2fkZKhM\nBxPWTh4SJ/m5V67qHVzRD00cNebOu9e4x+NkYBwLm13Pj1/Kg1JenmPqF6dU+N2t\nkO5RCclxJdyyOE85xfUv4GREiciCoNscw0qi4zzmo+icKE0hd0x4dYuS2ePnaerl\nEg7M89/B4YY9ot69iONdsnbKWJFWdKeB+khqqLd5uxoTgmh2BaO7DYbDiey2hEPH\n7b9WLCDXO0hHXh9VkB0r3sUncLe1UCsAfx0YnJ2F3YmQtEz71rbFa2AnakNgSkTw\n4/dqXT+3AgMBAAECggEARM/AQx4zHTx9SyXpYIcaNHUXy8Ln8c/mN4Tq7vsx8cBF\nPScrTt6lRmQ2gKR51y82ZUM3YQv5NScI8vPxBj/AMdaRvSLd9gRU6k/1PVuI/bdv\ntqVzScL7i0dw7o8VUNqEWo90O6Jl941bfIW1PNhMPLr9gjpAgJqauFwoCizyTcYO\nlCr5bDRwJPmK8VUfFDB1ujeWsSA6cxnjXWfLu9S+j6OIkL4Fz1VoBm9ZV00Nebef\nGiOCw1HuKbinywbEQaYU++fSE6E2yaDE73gpHxNpvbu1CgXyZW9pV73POM9m50J/\n9W6oZzs8g690WKwOU94GnU0aXydK1o4kfKPwyBlKQQKBgQDesDMaohlpqrWeVFZR\n7nQZMUgkMRk1wrAa2wXfvcHiomgESzds0J9mR+Avz7YWDspBg+zFpb2tJGU9lHX4\n1reXhmlw/+KBU93fucZ5ZKYANaPvIxHL0sBU9/03MfiZ9B4YgCtyJlP2wdQps6k0\nQbgsYOwBUYwK4CxUbBmODlw+dwKBgQDQ8GyI7T5YlP0PcmzZ6DNmGC7/sfNShD2b\nctL3pLW2PRRSrM6z7V0h5uDs0wBnKdZKWCNIEKfxA08WemPBFtVZMv9SYSAKczVy\nIYIA2cXhZPzJL6hg81m3punDK2WZd/1X0b11bmp5c+BFCsgDUwzYsrdtm3WsvifS\nuW+UAYEYwQKBgQDaMj2wr/pEji8s9ygpWYNKl/4+8Bjqk1voxIjp5U3P2iAfbO/e\n4D//gRfK4TRiQpWtQi3CsBa9Szcj8o7xhroXb21rel6fJ+Tz7Vzq31LES8rYaz1p\nwJQR7XegGIelmgvPJ+7qB2IoG13eipqViHuEiGdXF2cn1OW6xrz3c1yxGwKBgDMw\nM+b3+KZLGhSGvBRGxxDkK9+JAUveChnjb7wsJjiXjjsTCzEZng+IOOLMbvTXUyCz\npzEoo3xwixe+tGHB7lMEI3lTQj5NK3Lisq7yq4Ak9al0e5QFCp3rzql6IFIRC4hQ\nYlI60usecHt5wLbPyf3tCvNXeuTvUWJW+/cOx0oBAoGBAMFqvixY51958jW3wknB\nxORsuolzlrPjZu4oGfvQvo4/sgXLEjwNXRbFUuY4xheyinEZ0hB+4RmqZ9T9ki8/\nAyRABNTKkCvjp1TFdanooX9qgVNZ51ftgQsrhRqUWWwao12KvzR5p7UT1Gou1yJh\nWcAAUF700FwB3yFDP8keEro3\n-----END PRIVATE KEY-----\n"
FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL=firebase-adminsdk-fbsvc@gen-lang-client-0251517490.iam.gserviceaccount.com
FIREBASE_SERVICE_ACCOUNT_CLIENT_ID=103853457786176294803
FIREBASE_SERVICE_ACCOUNT_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_SERVICE_ACCOUNT_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gen-lang-client-0251517490.iam.gserviceaccount.com
FIREBASE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN=googleapis.com

# Google Cloud Speech (similar structure for the other JSON file)
GOOGLE_CLOUD_SPEECH_CREDENTIALS_TYPE=service_account
GOOGLE_CLOUD_SPEECH_CREDENTIALS_PROJECT_ID=gen-lang-client-0251517490
# ... (add all other fields from the speech credentials file)
```

---

## 🔍 **Verification Checklist**

After configuring all variables, verify:

- [ ] All required variables are set
- [ ] API keys are valid and have proper permissions
- [ ] Database connection is working
- [ ] Firebase authentication is functional
- [ ] AI services (Gemini/OpenAI) are responding
- [ ] Speech-to-text service is working
- [ ] CORS is properly configured for your frontend domain

---

## ⚠️ **Security Notes**

1. **Never commit API keys** to version control
2. **Use Render's environment variables** for sensitive data
3. **Rotate API keys** regularly
4. **Monitor API usage** to prevent unexpected charges
5. **Use least privilege** for service account permissions

---

## 🆘 **Troubleshooting**

### Common Issues:
1. **Database Connection Failed**: Check DB_HOST, DB_USER, DB_PASSWORD
2. **Firebase Auth Error**: Verify FIREBASE_PROJECT_ID and service account
3. **AI Service Unavailable**: Check GEMINI_API_KEY and OPENAI_API_KEY
4. **CORS Errors**: Verify ADDITIONAL_CORS_ORIGINS includes your frontend URL
5. **Speech-to-Text Fails**: Check Google Cloud credentials and API key

### Debug Commands:
```bash
# Check environment variables
echo $NODE_ENV
echo $DB_HOST
echo $GEMINI_API_KEY

# Test database connection
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1;"

# Test API keys (replace with actual endpoints)
curl -H "Authorization: Bearer $GEMINI_API_KEY" https://generativelanguage.googleapis.com/v1beta/models
```

---

*This configuration will ensure your Spice It Up backend runs properly on Render with all features functional.* 