# TalentFlow ATS - Production Deployment Guide

This guide details how to deploy the **TalentFlow ATS** application separately: the **Vite frontend** on Vercel/Netlify, and the **Node/Express backend** on Render/Railway.

---

## 1. Backend Deployment (Render or Railway)

The backend is a Node.js server connecting to MongoDB Atlas and Cloudinary.

### Environment Variables (Required in Production)

Add these variables to your Render Web Service or Railway project configuration:

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Mode of operation | `production` |
| `PORT` | Listening port | (Set automatically by Render/Railway, defaults to `5000` or `8080`) |
| `MONGODB_URI` | MongoDB Connection URL | `mongodb+srv://<user>:<password>@cluster.mongodb.net/talentflow_ats?retryWrites=true&w=majority` |
| `USE_MOCK_DB` | Bypass Mongoose | `false` (Must be false to use your real cloud database) |
| `SEED_DATABASE` | Seed DB on boot | `false` (Set to `false` in production. Only set to `true` once if you want to initialize database values, then set back to `false` to prevent future wipes) |
| `JWT_SECRET` | Secret key for access token | Choose a secure random string (e.g. `d7328df832bf9013efabec`) |
| `JWT_REFRESH_SECRET` | Secret key for refresh token | Choose a separate secure random string |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary Cloud Name | Your real Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Your real Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | Your real Cloudinary API Secret |
| `GEMINI_API_KEY` | (Optional) Gemini API Key | Your Google Gemini API Key to enable AI Resume Parsing & Recommendations |

### Deployment Configuration

* **Root Directory**: `server`
* **Build Command**: `npm install`
* **Start Command**: `npm start` (or `node src/index.js`)

---

## 2. Frontend Deployment (Vercel or Netlify)

The frontend is a static React application built using Vite.

### Environment Variables

| Variable | Description | Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | The URL of your deployed Express backend | `https://your-backend-domain.onrender.com/api` |

### Deployment Configuration

* **Root Directory**: `client`
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Framework Preset**: `Vite` (Vercel will detect this automatically)

### Vercel Routing Rules (Single Page Application Fallback)
Since this is a client-side Single Page Application (SPA) using `react-router-dom`, you need to configure fallback routing so that reloading pages doesn't result in a `404 Not Found` error.

#### For Vercel:
Create a file named `vercel.json` in the root of your `client` directory:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### For Netlify:
Create a file named `_redirects` inside the `client/public` directory:
```text
/*    /index.html   200
```

---

## 3. Post-Deployment Verification

1. **Backend Check**: Visit your deployed backend URL in a browser (e.g. `https://your-backend-domain.onrender.com/`). It should return:
   ```json
   { "message": "TalentFlow ATS API is running..." }
   ```
2. **Frontend Check**: Open your deployed Vercel URL, go to the candidate or recruiter signup, and ensure requests go through without any `net::ERR_CONNECTION_REFUSED` or CORS errors.
3. **CORS Checklist**: The Express backend is currently configured with `cors({ origin: '*' })` for ease of integration. For enhanced security in production, you can lock it down in `server/src/index.js` to only allow requests from your frontend domain.
