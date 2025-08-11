# Vercel Deployment Guide

## Prerequisites

1. **Neon Production Database**: Create a production database on [Neon](https://neon.tech)
2. **Vercel Account**: Sign up at [Vercel](https://vercel.com)

## Step 1: Create Production Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project for production
3. Copy the connection string (it will look like `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from project root:
   ```bash
   vercel --prod
   ```

### Option B: Deploy via GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure environment variables (see below)
6. Deploy

## Step 3: Configure Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

### Required Variables:
```
DATABASE_URL=postgresql://your_production_neon_connection_string
JWT_SECRET=your-super-secure-jwt-secret-for-production-256-bits-long
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

### Optional Variables:
```
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_USERNAME=admin
```

## Step 4: Set Up Production Database

After deployment, run the database setup:

1. Go to your Vercel project dashboard
2. Go to Functions tab
3. Find and run the setup script, or
4. Use Vercel CLI:
   ```bash
   vercel env pull .env.production
   node scripts/setup-production-db.js
   ```

## Step 5: Verify Deployment

1. Visit your Vercel app URL
2. Go to `/admin/login`
3. Login with:
   - Username: `admin`
   - Password: `admin123`
4. **Important**: Change the default password immediately!

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon production database connection string | `postgresql://user:pass@host.neon.tech/db` |
| `JWT_SECRET` | Secret for JWT token signing (must be 32+ chars) | `your-super-secure-jwt-secret` |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment mode | `production` |
| `ADMIN_EMAIL` | Default admin email | `admin@yourdomain.com` |
| `ADMIN_USERNAME` | Default admin username | `admin` |

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret (32+ characters)
- [ ] Verify database connection string is for production database
- [ ] Enable Vercel's security headers
- [ ] Set up monitoring and logging

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify all required dependencies are in `package.json`
- Check build logs for specific errors

### Database Connection Issues
- Verify Neon database is running
- Check connection string format
- Ensure database allows connections from Vercel IPs

### Runtime Errors
- Check Vercel function logs
- Verify environment variables are accessible at runtime
- Test API endpoints individually

## Post-Deployment

1. Set up monitoring and alerts
2. Configure custom domain (optional)
3. Set up backup strategy for database
4. Monitor performance and usage
5. Update admin credentials
6. Test all functionality in production

## Support

- Vercel Documentation: https://vercel.com/docs
- Neon Documentation: https://neon.tech/docs
- Next.js Documentation: https://nextjs.org/docs
