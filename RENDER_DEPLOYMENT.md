# Deploy Backend to Render

Quick guide to deploy your Factory Management Platform backend to Render.

## 🚀 Deployment Steps

### 1. Push Your Code to GitHub

```bash
cd backend
git add .
git commit -m "Fix Render deployment configuration"
git push origin main
```

### 2. Create Web Service on Render

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository: `Factory-Management-Platform-backend`

### 3. Configure the Service

**Basic Settings:**
- **Name**: `factory-management-backend` (or your preferred name)
- **Region**: Choose closest to you (e.g., Oregon, Frankfurt)
- **Branch**: `main`
- **Root Directory**: Leave empty (or set to `backend` if deploying from monorepo)
- **Runtime**: `Node`

**Build & Deploy:**
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
  
- **Start Command**: 
  ```bash
  npm start
  ```

**Instance Type:**
- Select **Free** tier

### 4. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `NODE_ENV` | `production` |
| `PORT` | `8000` |

**Your Neon Database URL should look like:**
```
postgresql://neondb_owner:npg_nPSL3gJI6Cqi@ep-jolly-queen-adcqapd8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 5. Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for the initial deployment
3. Render will:
   - Install dependencies
   - Compile TypeScript to JavaScript
   - Generate Prisma Client
   - Start the server

### 6. Run Database Migrations

After the first deployment, you need to run migrations:

1. Go to your service dashboard on Render
2. Click **"Shell"** tab
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

### 7. Get Your Backend URL

Once deployed, your backend will be available at:
```
https://factory-management-backend.onrender.com
```

Copy this URL - you'll need it for the frontend deployment!

---

## 🔧 Troubleshooting

### Build Fails with "Cannot find module"

**Problem**: TypeScript not compiling or dist folder not created

**Solution**: 
- Ensure `package.json` has correct build script:
  ```json
  "build": "tsc && prisma generate"
  ```
- Check that `tsconfig.json` has:
  ```json
  "outDir": "./dist",
  "rootDir": "./src"
  ```

### Database Connection Errors

**Problem**: Can't connect to Neon database

**Solution**:
- Verify `DATABASE_URL` includes `?sslmode=require`
- Check Neon dashboard - database should be active
- Ensure no IP restrictions in Neon settings

### Service Keeps Spinning Down

**Problem**: Free tier services sleep after 15 minutes of inactivity

**Solution**: 
- This is normal for free tier
- First request after sleep takes 30-60 seconds
- Consider upgrading to paid tier for production use
- Or use a service like UptimeRobot to ping your API every 14 minutes

### Prisma Client Not Generated

**Problem**: `@prisma/client` not found errors

**Solution**:
- Ensure `postinstall` script in `package.json`:
  ```json
  "postinstall": "prisma generate"
  ```
- Or add to build command:
  ```bash
  npm install && npx prisma generate && npm run build
  ```

---

## 📊 Monitoring Your Deployment

### View Logs
1. Go to your service on Render
2. Click **"Logs"** tab
3. Monitor real-time logs for errors

### Check Health
Visit your backend URL + `/health`:
```
https://factory-management-backend.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-12-20T10:00:00.000Z"
}
```

### Test API Endpoints
```bash
# Test furniture models endpoint
curl https://factory-management-backend.onrender.com/api/furniture-models

# Should return: []
```

---

## 🔄 Redeployment

Every time you push to GitHub, Render will automatically redeploy:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render will:
1. Detect the push
2. Start a new build
3. Run build command
4. Deploy if successful
5. Switch traffic to new version

---

## 💰 Free Tier Limits

- **750 hours/month** of runtime
- **100 GB bandwidth**
- Service sleeps after **15 minutes** of inactivity
- **512 MB RAM**

---

## 🎯 Next Steps

After backend is deployed:

1. ✅ Copy your backend URL
2. ✅ Update frontend `.env`:
   ```env
   VITE_API_URL=https://factory-management-backend.onrender.com
   ```
3. ✅ Rebuild frontend:
   ```bash
   cd frontend
   npm run build
   ```
4. ✅ Deploy frontend to Vercel

---

## 📝 Important Notes

- First deployment takes 5-10 minutes
- Subsequent deployments take 2-5 minutes
- Free tier services may have cold starts
- Always run migrations after schema changes
- Keep your `DATABASE_URL` secret and secure

---

## 🆘 Need Help?

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- Check backend logs for specific errors
- Verify all environment variables are set correctly
