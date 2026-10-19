# Backend Environment Variables Setup

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration
DATABASE_PATH=./database/events.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d

# Google OAuth Configuration
# Get these from: https://console.cloud.google.com/apis/credentials
# 1. Create a new project or select existing one
# 2. Enable Google+ API
# 3. Create OAuth 2.0 Client ID (Web application)
# 4. Add authorized redirect URIs: http://localhost:5173
# 5. Copy the Client ID and paste it below
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Steps to Get Google OAuth Client ID:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application** as the application type
6. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:5000`
7. Add authorized redirect URIs:
   - `http://localhost:5173`
8. Copy the **Client ID** and paste it in your `.env` file

## Security Notes:

- **Never commit the `.env` file to version control**
- Use a strong, random string for `JWT_SECRET` (at least 32 characters)
- In production, use environment variables from your hosting platform
- Keep your Google OAuth credentials secure


