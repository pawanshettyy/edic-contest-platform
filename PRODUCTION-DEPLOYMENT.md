# 🚀 EDIC Contest Platform - Production Deployment Guide

This guide walks you through deploying the EDIC Contest Platform to production.

## 📋 Prerequisites

- Node.js 18+ and npm 8+
- Neon PostgreSQL database account
- Vercel account (or other hosting platform)
- Domain name (optional but recommended)

## 🔧 Step 1: Environment Setup

### 1.1 Set up environment variables

```bash
# Create and configure environment variables
npm run setup:env
```

### 1.2 Required Environment Variables

Create a `.env.local` file or set these in your hosting platform:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Security
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Application URL (for production)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Environment
NODE_ENV=production
```

### 1.3 Generate Secure JWT Secret

The setup script will generate a secure JWT secret, or you can generate one manually:

```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🗄️ Step 2: Database Setup

### 2.1 Create Neon Database

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Set it as `DATABASE_URL` in your environment

### 2.2 Run Database Migrations

```bash
# Generate migration files
npm run migrate:production

# Apply migrations to your database (manual step)
# Use psql, pgAdmin, or Neon's web interface to run the migration SQL
```

## 🌐 Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Login and Deploy

```bash
# Login to Vercel
vercel login

# Set environment variables (replace with your actual values)
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add NEXT_PUBLIC_APP_URL

# Deploy to production
npm run deploy
```

### 3.3 Alternative: Deploy via GitHub

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Push to main branch to trigger deployment

## ⚙️ Step 4: Production Setup

### 4.1 Initialize Production Database

After deployment, initialize the database with admin users and default configuration:

```bash
# Set your production URL
export NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Run production setup
npm run setup:production
```

This will:
- Create default admin users
- Initialize contest configuration
- Set up required data

### 4.2 Verify Deployment

```bash
# Run comprehensive deployment verification
npm run verify:deployment
```

This checks:
- ✅ Application accessibility
- ✅ Database connectivity
- ✅ API endpoints
- ✅ Frontend routes
- ✅ Admin functionality

## 🔐 Step 5: Admin Setup

### 5.1 Access Admin Panel

1. Navigate to `https://your-domain.com/admin/login`
2. Use default credentials or the ones you set during setup
3. Change default passwords immediately

### 5.2 Configure Contest

1. **Contest Settings**: `/admin/config`
   - Set contest name and description
   - Configure start/end dates
   - Set team limits and size

2. **Add Questions**: `/admin/questions`
   - Create quiz questions
   - Set difficulty levels
   - Configure time limits

3. **Manage Teams**: `/admin/teams`
   - Create or import teams
   - Set presentation order
   - Manage team status

## 📊 Step 6: Monitoring & Maintenance

### 6.1 Regular Backups

```bash
# Create database backup
npm run backup:database
```

### 6.2 Monitor Application

```bash
# View production logs
npm run logs:production

# Check deployment status
npm run verify:deployment
```

### 6.3 Health Monitoring

The platform includes built-in health checks:
- Health endpoint: `/api/health`
- Database connectivity monitoring
- Error logging and tracking

## 🔄 Step 7: Updates & Maintenance

### 7.1 Deploying Updates

```bash
# Before deploying updates
npm run deploy:check

# Deploy to production
npm run deploy
```

### 7.2 Database Migrations

For future schema changes:

1. Create new migration files
2. Test in development
3. Apply to production database
4. Deploy application updates

## 🛠️ Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Check Neon database is active
- Ensure SSL mode is enabled

**Admin Login Issues**
- Run `npm run setup:production` again
- Check JWT_SECRET is set correctly
- Verify admin users were created

**Build Failures**
- Run `npm run type-check` to check TypeScript errors
- Verify all dependencies are installed
- Check for environment variable issues

**Performance Issues**
- Monitor database connection limits
- Check Vercel function logs
- Optimize database queries if needed

### Support

For additional support:
1. Check application logs in Vercel dashboard
2. Monitor database performance in Neon console
3. Review error logs in admin panel
4. Verify environment variables are correctly set

## 📚 Production Scripts Reference

```bash
# Environment & Setup
npm run setup:env              # Configure environment variables
npm run setup:production       # Initialize production database
npm run migrate:production     # Generate database migrations

# Deployment & Verification
npm run deploy                 # Deploy to production
npm run deploy:preview         # Deploy preview version
npm run verify:deployment      # Verify deployment health
npm run deploy:check           # Full pre-deployment check

# Maintenance
npm run backup:database        # Backup database data
npm run logs:production        # View production logs
```

## 🎯 Success Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Application deployed successfully
- [ ] Production setup completed
- [ ] Admin panel accessible
- [ ] Contest configured
- [ ] Questions added
- [ ] Teams set up
- [ ] Deployment verified
- [ ] Backups configured
- [ ] Monitoring in place

Your EDIC Contest Platform is now ready for production! 🎉

---

**Need Help?** Check the troubleshooting section or review the deployment verification output for specific issues.
