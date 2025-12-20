# 🚀 Quick Deployment Guide

## Prerequisites
- ✅ Node.js 18+
- ✅ PostgreSQL database (Neon recommended for production)
- ✅ GitHub account
- ✅ Render account (free tier available)

---

## 📦 Deploy to Render (5 Minutes)

### Step 1: Prepare Your Database
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy your connection string (looks like: `postgresql://user:pass@host.neon.tech/db?sslmode=require`)

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

### Step 3: Deploy on Render
1. Go to [render.com](https://render.com/dashboard)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` ✅

### Step 4: Set Environment Variables
In Render dashboard, add:
- **DATABASE_URL**: Your Neon connection string
- **NODE_ENV**: `production` (already set in render.yaml)

### Step 5: Deploy & Migrate
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Once live, go to **Shell** tab and run:
   ```bash
   npx prisma migrate deploy
   ```

### Step 6: Verify Deployment
Visit your backend URL:
```
https://your-service-name.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-12-20T12:00:00.000Z",
  "environment": "production",
  "uptime": 123.45
}
```

---

## 🧪 Local Testing Before Deployment

Test your production build locally:

```bash
# 1. Build the project
npm run build

# 2. Check for TypeScript errors
npm run build:check

# 3. Start in production mode
npm run start:prod

# 4. Test the health endpoint
curl http://localhost:8000/health

# 5. Test an API endpoint
curl http://localhost:8000/api/furniture-models
```

---

## 📋 Deployment Checklist

Before deploying, ensure:

- [ ] `.env` is in `.gitignore` (never commit secrets!)
- [ ] `DATABASE_URL` is set in Render environment variables
- [ ] All TypeScript files compile without errors (`npm run build:check`)
- [ ] Local build works (`npm run build`)
- [ ] Migrations are up to date (`npx prisma migrate dev`)
- [ ] Code is pushed to GitHub
- [ ] Render service is created and configured

After first deployment:

- [ ] Run migrations in Render Shell (`npx prisma migrate deploy`)
- [ ] Test health endpoint
- [ ] Test API endpoints
- [ ] Update frontend `VITE_API_URL` with backend URL
- [ ] Monitor logs for errors

---

## 🔧 Common Issues & Solutions

### Build Fails
**Problem**: TypeScript compilation errors
**Solution**: Run `npm run build:check` locally to see errors

### Cannot Connect to Database
**Problem**: Invalid `DATABASE_URL`
**Solution**: 
- Check Neon dashboard - database should be active
- Ensure connection string includes `?sslmode=require`
- Verify no typos in environment variable

### Module Not Found Error
**Problem**: Missing dependencies
**Solution**: 
- Ensure TypeScript and Prisma are in `dependencies` (not devDependencies)
- Check `package.json` has correct dependency placement

### Service Keeps Restarting
**Problem**: Server crashes on startup
**Solution**:
- Check Render logs for error messages
- Verify `PORT` is not hardcoded (Render sets it automatically)
- Ensure database migrations are applied

### 404 on API Endpoints
**Problem**: Routes not working
**Solution**:
- Verify you're using `/api/` prefix in requests
- Check server logs to see if routes are registered
- Test health endpoint first: `/health`

---

## 🔄 Redeployment

Every push to `main` branch triggers auto-deployment:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render will:
1. Detect the push
2. Run build command
3. Deploy if successful
4. Switch traffic to new version (zero downtime)

---

## 📊 Monitoring

### View Logs
Render Dashboard → Your Service → **Logs** tab

### Check Health
```bash
curl https://your-service.onrender.com/health
```

### Test Endpoints
```bash
# List all furniture models
curl https://your-service.onrender.com/api/furniture-models

# Get dashboard stats
curl https://your-service.onrender.com/api/dashboard/stats
```

---

## 💡 Pro Tips

1. **Free Tier Sleep**: Free services sleep after 15 minutes of inactivity
   - First request after sleep takes 30-60 seconds
   - Use UptimeRobot to keep it awake

2. **Database Backups**: Neon provides automatic backups
   - Check Neon dashboard for backup settings

3. **Environment Variables**: Never commit `.env` file
   - Always use Render's environment variable settings

4. **Logs**: Monitor logs regularly for errors
   - Set up log alerts in Render

5. **Performance**: Free tier has limited resources
   - Optimize database queries
   - Add indexes to frequently queried fields

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Check Logs**: Most issues show up in deployment logs
- **GitHub Issues**: Open an issue in your repository

---

## 🎯 Next Steps

After backend is deployed:

1. ✅ Copy your backend URL
2. ✅ Update frontend `.env`:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
3. ✅ Deploy frontend to Vercel
4. ✅ Test the full application

Your Factory Management Platform is now live! 🎉
