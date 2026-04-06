# Online Deployment Guide: Financial Favorites Portal (MongoDB Atlas)

Your portal is now fully migrated to a professional **Node.js/Express + MongoDB Atlas** architecture. It is optimized for production deployment on platforms like Render.

## Recommended Hosting: Render.com

Render is highly recommended for this project due to its excellent support for Node.js and environment variables.

### 1. GitHub Configuration
- Your project is already synchronized with the `hawkins7575/financial-favorites` repository.
- Ensure `server.js`, `package.json`, and the `models/` folder are in the root directory.

### 2. MongoDB Atlas Setup (Required)
1.  Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a **Free Cluster** (M0).
3.  Under **Network Access**, add `0.0.0.0/0` (Allow access from anywhere) so Render can connect.
4.  Under **Database User**, create a user and password.
5.  Click **Connect** -> **Drivers** to get your **Connection String** (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/mymoney`).

### 3. Deploying to Render
1.  Go to [Render.com](https://render.com/) and click **New +** -> **Web Service**.
2.  Connect your GitHub repository: `financial-favorites`.
3.  **Name**: `financial-favorites` (or your choice).
4.  **Region**: Choose the one closest to you.
5.  **Runtime**: `Node`.
6.  **Build Command**: `npm install`.
7.  **Start Command**: `node server.js`.

### 4. Environment Variables (Critical)
In the Render dashboard, go to the **Environment** tab and add:
- `MONGODB_URI`: Your MongoDB Atlas connection string.
- `PORT`: `10000` (Render's default, though `server.js` will auto-detect).

## Verification
Once the deployment brand "Live" appears, visit your Render URL.
- The app will automatically initialize the database from the current frontend state if it's empty.
- Multi-column footers and premium site badges should be visible.

> [!IMPORTANT]
> The backend uses a "full-sync" model. Any changes made in the UI (adding bookmarks, etc.) are sent to the MongoDB server and persisted across all sessions.

---
*Created by Antigravity AI Assistant*
