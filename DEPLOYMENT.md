# Deployment Guide for EDIC Contest Platform

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: Set up a PostgreSQL database (recommended: Supabase, Railway, or Vercel Postgres)
3. **Environment Variables**: Configure all required environment variables

## Database Setup

### Option 1: Supabase (Recommended for Free Tier)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings > Database and copy the connection string
3. In the SQL Editor, run the contents of `database/schema.sql`
4. Note down your `DATABASE_URL`

### Option 2: Railway

1. Go to [railway.app](https://railway.app) and create a new PostgreSQL database
2. Copy the connection string from the database settings
3. Connect using a PostgreSQL client and run `database/schema.sql`

### Option 3: Vercel Postgres

1. In your Vercel dashboard, go to Storage > Create Database
2. Select PostgreSQL and create the database
3. Use the provided connection string
4. Run the schema using the Vercel dashboard SQL editor

## Vercel Deployment Steps

### 1. Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel
```

### 2. Set Environment Variables

In your Vercel dashboard, go to Project Settings > Environment Variables and add:

**Required Variables:**
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-project.vercel.app
```

**Optional Variables:**
```
CONTEST_START_DATE=2025-08-05T00:00:00.000Z
CONTEST_END_DATE=2025-08-06T23:59:59.999Z
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Generate Secrets

```bash
# Generate JWT Secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate NextAuth Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Database Migration

After deployment, run the database schema:

```sql
-- Connect to your database and run:
-- database/schema.sql
```

### 5. Custom Domain (Optional)

1. In Vercel dashboard, go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain

## Environment Configuration

### Production Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Authentication
JWT_SECRET="your-production-jwt-secret-32-chars-minimum"
NEXTAUTH_SECRET="your-production-nextauth-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Contest Settings
CONTEST_START_DATE="2025-08-05T00:00:00.000Z"
CONTEST_END_DATE="2025-08-06T23:59:59.999Z"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587" 
SMTP_USER="contest@yourdomain.com"
SMTP_PASS="your-gmail-app-password"
```

## Security Checklist

- [ ] Strong JWT secret (32+ characters, random)
- [ ] Database connection uses SSL
- [ ] Environment variables are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Sensitive data is not logged

## Performance Optimization

### Database Optimization
```sql
-- Add indexes for frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email) WHERE team_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_progress_active ON team_progress(team_id, round_id);
```

### Vercel Configuration
```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Monitoring and Maintenance

### Health Check Endpoint
Access `/api/health` to check system status

### Database Backups
- Set up automated backups in your database provider
- Test backup restoration regularly

### Logs and Analytics
- Enable Vercel Analytics
- Monitor API response times
- Set up error tracking (Sentry recommended)

## Scaling Considerations

### For Large Competitions (1000+ teams)

1. **Database Optimization**
   - Connection pooling
   - Read replicas
   - Query optimization

2. **Caching**
   - Redis for session storage
   - CDN for static assets
   - API response caching

3. **Rate Limiting**
   ```typescript
   // Implement rate limiting per team
   const RATE_LIMIT = {
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // requests per window
   };
   ```

4. **Load Testing**
   ```bash
   # Test with expected load
   npx autocannon -c 10 -d 30 https://your-domain.vercel.app/api/auth/signin
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify SSL settings
   - Ensure database is accessible from Vercel

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure secret is consistent across deployments

3. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies are installed
   - Review build logs in Vercel dashboard

### Debug Commands

```bash
# Local development
npm run dev

# Build locally
npm run build

# Check environment variables
vercel env ls

# View deployment logs
vercel logs
```

## Post-Deployment

1. Test all authentication flows
2. Verify database connectivity
3. Test contest functionality
4. Set up monitoring alerts
5. Document admin procedures
6. Create backup restoration procedure

## Support

For issues during deployment:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connectivity
4. Review Next.js build output
5. Check network and DNS settings
