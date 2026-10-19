# Frontend Environment Variables Setup

Create a `.env` file in the `frontend/` directory with the following variables:

```env
# Google OAuth Client ID (same as backend)
# Get this from: https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
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

## Notes:

- The `VITE_` prefix is required for Vite to expose the variable to the frontend
- This should be the same Client ID used in the backend `.env` file
- **Never commit the `.env` file to version control**


