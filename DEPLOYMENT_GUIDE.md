# EDIC Contest Platform - Vercel Deployment Guide

This guide will help you deploy the EDIC Contest Platform to Vercel for production use.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **PostgreSQL Database**: Set up a production database (recommended: Neon, Supabase, or PlanetScale)
4. **Environment Variables**: Required configuration values

## Step 1: Database Setup

### Option A: Using Neon (Recommended)
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project: "EDIC Contest Platform"
3. Copy the connection string provided
4. Run the schema setup:
   ```sql
   -- Use the SQL editor in Neon console or psql
   -- Copy and paste the contents of database/optimized-schema.sql
   ```

### Option B: Using Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to Settings > Database
3. Copy the connection string
4. Go to SQL Editor and run the schema from `database/optimized-schema.sql`

### Option C: Your Own PostgreSQL Server
1. Ensure your PostgreSQL server is accessible from the internet
2. Create a database named `edic_contest`
3. Run the schema: `psql -f database/optimized-schema.sql`

## Step 2: Prepare Environment Variables

Create these environment variables for Vercel deployment:

### Required Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long

# Application URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Optional Variables
```bash
# Contest Configuration
CONTEST_NAME="EDIC Business Challenge"
QUIZ_TIME_LIMIT=900
VOTING_TIME_LIMIT=30

# Database Pool
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000

# Logging
LOG_LEVEL=info
ENABLE_ADMIN_LOGS=true
```

## Step 3: Deploy to Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository: `edic-contest-platform`

2. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

3. **Set Environment Variables**:
   - Go to Settings > Environment Variables
   - Add each required variable:
     ```
     DATABASE_URL: your-database-connection-string
     JWT_SECRET: your-secure-jwt-secret
     NEXT_PUBLIC_APP_URL: https://your-app.vercel.app
     NODE_ENV: production
     ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be available at `https://your-app.vercel.app`

### Method 2: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   # From project root
   vercel

   # For production deployment
   vercel --prod
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   vercel env add NEXT_PUBLIC_APP_URL production
   vercel env add NODE_ENV production
   ```

## Step 4: Post-Deployment Configuration

### 1. Database Migration
After deployment, run the database migration if needed:
```sql
-- Execute in your database console
-- Run the migration script: database/migration_add_category_to_options.sql
```

### 2. Admin Account Setup
The platform includes a default admin account:
- **Username**: `admin`
- **Password**: `admin123`
- **⚠️ IMPORTANT**: Change this password immediately after first login!

### 3. Verify Deployment
1. Visit your deployed URL
2. Go to `/admin/login`
3. Login with default credentials
4. Change the admin password
5. Test creating questions and managing the contest

## Step 5: Domain Configuration (Optional)

### Using Custom Domain
1. In Vercel Dashboard > Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) | `your-super-secure-secret-key` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app's public URL | `https://your-app.vercel.app` |
| `NODE_ENV` | ✅ | Environment mode | `production` |
| `CONTEST_NAME` | ❌ | Contest display name | `"EDIC Business Challenge"` |
| `QUIZ_TIME_LIMIT` | ❌ | Quiz duration in seconds | `900` |
| `VOTING_TIME_LIMIT` | ❌ | Voting time per question | `30` |

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build logs in Vercel dashboard
   # Common fixes:
   - Ensure all TypeScript errors are resolved
   - Check package.json dependencies
   - Verify Node.js version compatibility
   ```

2. **Database Connection Issues**:
   ```bash
   # Verify DATABASE_URL format
   # Check database server accessibility
   # Ensure SSL configuration if required
   ```

3. **Environment Variable Issues**:
   ```bash
   # Check variable names (case-sensitive)
   # Ensure no extra spaces in values
   # Verify all required variables are set
   ```

### Debug Commands
```bash
# Check deployment logs
vercel logs [deployment-url]

# List environment variables
vercel env ls

# Remove and re-add problematic variables
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME
```

## Performance Optimization

### Recommended Vercel Settings
- **Function Region**: Choose closest to your users
- **Edge Network**: Enable for global performance
- **Analytics**: Enable for monitoring

### Database Optimization
- Use connection pooling
- Implement query optimization
- Monitor database performance
- Set up read replicas if needed

## Security Best Practices

1. **Environment Variables**:
   - Use strong, unique JWT secrets
   - Rotate secrets periodically
   - Never commit secrets to repository

2. **Database Security**:
   - Use SSL connections
   - Implement proper user permissions
   - Regular security updates

3. **Application Security**:
   - Change default admin credentials
   - Implement rate limiting
   - Monitor for suspicious activity

## Monitoring and Maintenance

### Health Checks
- Monitor `/api/health` endpoint
- Set up uptime monitoring
- Configure error tracking

### Regular Maintenance
- Database backups
- Security updates
- Performance monitoring
- Log analysis

## Support

For deployment issues:
1. Check Vercel documentation
2. Review application logs
3. Test locally first
4. Contact support if needed

---

## Quick Deployment Checklist

- [ ] Database created and schema deployed
- [ ] Environment variables configured
- [ ] Repository connected to Vercel
- [ ] Build completed successfully
- [ ] Admin login working
- [ ] Default password changed
- [ ] Question bank functionality tested
- [ ] Contest configuration verified
- [ ] Custom domain configured (if applicable)

---

**Last Updated**: August 2025
**Platform Version**: 1.0.0
