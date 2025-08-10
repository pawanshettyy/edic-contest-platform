# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### Database Setup
- [ ] Created production Neon database
- [ ] Copied production DATABASE_URL
- [ ] Generated strong JWT_SECRET (32+ characters)

### Code Preparation
- [ ] All Supabase dependencies removed ✅
- [ ] Neon serverless driver implemented ✅
- [ ] Production build passes ✅
- [ ] All TypeScript errors resolved ✅

### Configuration Files
- [ ] `vercel.json` configured ✅
- [ ] `.vercelignore` created ✅
- [ ] Environment variables documented ✅

## 🔧 Deployment Steps

### 1. Create Production Neon Database
```bash
# Go to https://console.neon.tech
# Create new project
# Copy connection string
```

### 2. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

#### Option B: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 3. Environment Variables to Set in Vercel

**Required:**
```
DATABASE_URL=postgresql://user:pass@prod-host.neon.tech/db?sslmode=require
JWT_SECRET=your-super-secure-jwt-secret-for-production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

**Optional:**
```
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
```

### 4. Post-Deployment Setup

```bash
# Run database setup (after environment variables are set)
npm run db:setup-prod
```

## 🔍 Verification Steps

### 1. Health Check
- [ ] Visit `https://your-app.vercel.app/api/health`
- [ ] Verify database connection is healthy

### 2. Admin Access
- [ ] Visit `https://your-app.vercel.app/admin/login`
- [ ] Login with username: `admin`, password: `admin123`
- [ ] **IMPORTANT:** Change default password immediately

### 3. Functionality Tests
- [ ] Team registration works
- [ ] Quiz functionality works
- [ ] Voting system works
- [ ] Admin dashboard accessible
- [ ] All API endpoints respond correctly

## 🛡️ Security Post-Deployment

- [ ] Change default admin password
- [ ] Verify JWT secret is strong and unique
- [ ] Review admin permissions
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting if needed

## 📊 Monitoring

- [ ] Set up Vercel analytics
- [ ] Monitor function execution times
- [ ] Watch for database connection issues
- [ ] Set up error alerting

## 🚨 Troubleshooting

### Build Fails
1. Check environment variables in Vercel dashboard
2. Verify all dependencies in package.json
3. Check Vercel build logs for specific errors

### Database Connection Issues
1. Verify Neon database is active
2. Check connection string format
3. Test with health endpoint: `/api/health`

### Runtime Errors
1. Check Vercel function logs
2. Verify environment variables are set
3. Test individual API endpoints

## 📋 Final Production URLs

- **App:** https://your-app.vercel.app
- **Admin:** https://your-app.vercel.app/admin/login
- **Health:** https://your-app.vercel.app/api/health
- **Dashboard:** https://your-app.vercel.app/dashboard

## 🔗 Quick Deploy Commands

```bash
# Build and test locally
npm run build

# Deploy to Vercel
npm run deploy

# Preview deployment
npm run preview

# Setup production database
npm run db:setup-prod
```

---

**✨ Your EDIC Contest Platform is ready for production deployment!**
