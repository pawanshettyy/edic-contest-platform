# 🛠️ Production Scripts

This directory contains production deployment and management scripts for the EDIC Contest Platform.

## 📋 Available Scripts

### 🚀 Quick Setup
```bash
npm run production:init     # One-command setup for production deployment
```

### ⚙️ Environment & Configuration
```bash
npm run setup:env          # Configure environment variables and create templates
npm run setup:production   # Initialize production database with admin users
npm run migrate:production # Generate database migration files
```

### 🌐 Deployment & Verification
```bash
npm run deploy:check       # Pre-deployment checks (type-check + build + verify)
npm run deploy             # Deploy to production (Vercel)
npm run deploy:preview     # Deploy preview version
npm run verify:deployment  # Verify deployment is working correctly
```

### 🔧 Maintenance & Monitoring
```bash
npm run backup:database    # Create database backup (JSON format)
npm run logs:production    # View production logs
```

## 📁 Script Files

- **`production-init.js`** - One-command automated setup
- **`setup-env.js`** - Environment variable configuration helper
- **`setup-production.js`** - Production database initialization
- **`migrate-database.js`** - Database schema migration generator
- **`backup-database.js`** - Database backup utility
- **`verify-deployment.js`** - Deployment health verification

## 🚀 Quick Start

For first-time production deployment:

```bash
# 1. Quick automated setup
npm run production:init

# 2. Set environment variables in your hosting platform
# 3. Deploy your application
npm run deploy

# 4. Initialize production database
npm run setup:production

# 5. Verify everything is working
npm run verify:deployment
```

## 📖 Documentation

For detailed deployment instructions, see [PRODUCTION-DEPLOYMENT.md](../PRODUCTION-DEPLOYMENT.md).

## 🔧 Prerequisites

- Node.js 18+
- Neon PostgreSQL database
- Vercel account (or alternative hosting)
- Environment variables configured

## ⚠️ Important Notes

- Always run `npm run deploy:check` before deploying
- Keep database backups before major updates
- Verify deployment after each release
- Monitor production logs regularly

---

**Need help?** Check the main deployment guide or run the verification script to diagnose issues.
