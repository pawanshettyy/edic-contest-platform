# 🏆 EDIC Contest Platform

A comprehensive contest management platform for entrepreneurship competitions. Built with **Next.js 15**, **TypeScript**, and **PostgreSQL** with modern authentication and real-time features.

![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Next.js](https://img.shields.io/badge/next.js-15.4.4-blueviolet.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+ (or use Neon/Supabase)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/pawanshettyy/edic-contest-platform.git
cd edic-contest-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Set up the database
npm run setup:production  # For production
# OR
npm run setup:development  # For development

# Start the development server
npm run dev
```

Visit http://localhost:3000 to see the application.

## 🎯 Features

### 🏅 Contest Management

- **Multi-round competitions**: Quiz → Voting → Results
- **Team registration** with secure authentication
- **Real-time scoreboard** and rankings
- **Flexible contest configuration**
- **Automated scoring** with customizable weights

### 📝 Quiz System

- **Interactive MCQ interface** with timer
- **Dynamic question loading**
- **Points-based scoring** (positive/negative)
- **Category-based questions**
- **Real-time progress tracking**

### 🗳️ Voting System

- **Peer-to-peer voting** for presentations
- **Anti-spam protection** with vote limits
- **Real-time vote counting**
- **Fair voting algorithms**

### 👨‍💼 Admin Dashboard

- **Comprehensive team management**
- **Question bank administration**
- **Contest configuration panel**
- **Real-time monitoring** and analytics
- **Activity logs** and audit trails
- **Multi-admin support** with role-based access

### 🔐 Security Features

- **JWT-based authentication** with HTTP-only cookies
- **bcrypt password hashing**
- **Role-based access control**
- **SQL injection protection**
- **XSS prevention**
- **CSRF protection**

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Neon Serverless
- **Authentication**: JWT with HTTP-only cookies
- **Styling**: Tailwind CSS + Shadcn/ui
- **Language**: TypeScript (100% type-safe)

### Database Schema

```sql
📊 Core Tables:
├── teams (team registration & scores)
├── admin_users (multi-admin system)
├── quiz_questions (question bank)
├── quiz_options (MCQ options)
├── quiz_responses (team answers)
├── voting_sessions (voting management)
├── votes (voting results)
├── contest_config (system configuration)
├── audit_logs (security monitoring)
└── rate_limits (abuse prevention)
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run type-check   # Check TypeScript types
npm run deploy:prep  # Prepare for deployment
npm run seed:questions # Seed quiz questions
```

### Environment Variables

```env
# Database (Required)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication (Required)
JWT_SECRET=your-32-character-secret-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Contest Configuration
MAX_TEAMS=50
TEAM_SIZE=5
QUIZ_DURATION_MINUTES=30
QUESTIONS_PER_QUIZ=15
REGISTRATION_OPEN=true
```

## 🚀 Production Deployment

### Vercel Deployment (Recommended)

1. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

2. **Set Environment Variables** in Vercel Dashboard:
   - `DATABASE_URL` (your PostgreSQL connection string)
   - `JWT_SECRET` (generate a secure 32-character secret)
   - `NEXT_PUBLIC_APP_URL` (your domain)

3. **Set up Production Database**:
   ```bash
   npm run setup:production
   ```

### Alternative Deployment Options

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Self-hosted
```bash
npm run build
npm run start
# Application runs on port 3000
```

## 🔐 Security & Production Checklist

### Pre-Deployment Security

- [ ] Generate new 64+ character JWT_SECRET
- [ ] Set NODE_ENV=production
- [ ] Configure proper DATABASE_URL with SSL
- [ ] Set NEXT_PUBLIC_APP_URL to production domain
- [ ] Remove development/debug environment variables

### Database Security

- [ ] Run security-schema.sql for audit logging
- [ ] Create dedicated database user with minimal permissions
- [ ] Enable SSL connections only (sslmode=require)
- [ ] Configure regular database backups
- [ ] Remove test/sample data

### Application Security

- [ ] JWT secrets are cryptographically secure
- [ ] All passwords are bcrypt hashed with salt rounds >= 12
- [ ] Rate limiting is enabled for authentication endpoints
- [ ] HTTPS is enforced
- [ ] Content Security Policy is properly configured

### Monitoring and Logging

- [ ] Audit logging is enabled
- [ ] Security monitoring dashboard is accessible to admins
- [ ] Error tracking is configured
- [ ] Log rotation is configured
- [ ] No sensitive data is logged

## 🔧 Configuration

### Contest Settings

- **Team Limits**: Maximum 50 teams (configurable)
- **Team Size**: 5 members per team
- **Quiz Duration**: 30 minutes maximum
- **Questions**: Up to 15 questions per quiz
- **Voting Window**: Customizable duration
- **Scoring Weights**: Quiz (40%) + Voting (30%) + Offline (30%)

### Admin Access

The platform includes a multi-admin system with role-based access:

| Role          | Username          | Default Password      | Permissions          |
| ------------- | ----------------- | --------------------- | -------------------- |
| Super Admin   | `superadmin`    | `SuperAdmin@2025`   | Full system access   |
| Contest Admin | `admin_contest` | `ContestAdmin@2025` | Contest management   |
| Tech Admin    | `admin_tech`    | `TechAdmin@2025`    | Technical monitoring |

**⚠️ Important**: Change default passwords immediately after first login!

### Database Providers

#### Neon (Recommended)
- Free PostgreSQL hosting
- Serverless with auto-scaling
- Built-in connection pooling
- Easy setup with web dashboard

#### Alternative Options
- **Supabase**: Free tier with web interface
- **Railway**: Simple deployment platform
- **Local PostgreSQL**: For development

## 📊 Usage Guide

### For Contest Organizers

1. **Setup Contest**:
   - Configure contest settings in admin panel
   - Create quiz questions (max 15)
   - Set team registration deadline

2. **Manage Teams**:
   - Monitor team registrations
   - Verify team details
   - Handle any issues

3. **Run Contest**:
   - Start quiz round
   - Monitor live progress
   - Manage voting phase
   - View final results

### For Participants

1. **Team Registration**:
   - Register with team name and details
   - Get team code for member access
   - All members use same team code

2. **Contest Participation**:
   - Login with team credentials
   - Complete quiz within time limit
   - Submit presentation for voting
   - Vote for other teams

## 🛠️ Production Scripts

### Available Production Scripts

```bash
# Environment & Setup
npm run setup:production       # Initialize production database
npm run seed:questions         # Seed quiz questions

# Deployment & Verification
npm run deploy:prep            # Prepare for deployment
npm run build                  # Build for production
npm run start                  # Start production server

# Maintenance
npm run type-check             # Check TypeScript types
npm run lint                   # Run linting checks
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database URL format
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Test connection
npm run setup:production
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

#### Authentication Issues
```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Reset admin passwords
npm run setup:production
```

### Performance Optimization

#### Database
- Indexes are automatically created for optimal performance
- Connection pooling with Neon serverless
- Optimized queries with prepared statements

#### Frontend
- Static generation for public pages
- Dynamic imports for large components
- Image optimization with Next.js

## 🔐 Security Features

### Security Headers
The application automatically sets these security headers:

- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-XSS-Protection**: 1; mode=block (XSS protection)
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Strict-Transport-Security**: max-age=31536000 (HTTPS only)
- **Content-Security-Policy**: Strict CSP with nonce-based scripts
- **Permissions-Policy**: Restricts browser features

### Health Checks
- Health endpoint: `/api/health`
- Database connectivity monitoring
- Error logging and tracking

## 📁 Project Structure

```
edic-contest-platform/
├── src/                    # Source code
│   ├── app/               # Next.js app directory
│   │   ├── api/           # API routes
│   │   ├── admin/         # Admin dashboard
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Team dashboard
│   │   ├── quiz/          # Quiz interface
│   │   ├── voting/        # Voting interface
│   │   └── results/       # Results display
│   ├── components/        # Reusable components
│   ├── lib/               # Utility libraries
│   └── styles/            # Global styles
├── database/               # Database schemas and migrations
├── scripts/                # Utility scripts
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🔄 Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

## 📚 Additional Resources

### Database Migrations
- **Initial Schema**: `database/migrations/1_0_0_initial_schema.sql`
- **Production Schema**: `database/production-schema-v4.sql`
- **Security Schema**: `database/security-schema.sql`
- **Voting Schema**: `database/voting-schema.sql`

### Security Monitoring
```sql
-- View security dashboard
SELECT * FROM security_dashboard;

-- Check recent security events
SELECT * FROM audit_logs 
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Check rate limits
SELECT * FROM rate_limits 
WHERE locked_until > NOW();
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

## 🚨 Incident Response

### If Compromise Suspected:
1. **Immediate Actions**:
   - Change JWT_SECRET (invalidates all sessions)
   - Check audit logs for suspicious activity
   - Review rate limit violations
   - Check for SQL injection attempts

2. **Investigation**:
   ```sql
   -- Check failed login attempts
   SELECT * FROM audit_logs 
   WHERE event_type LIKE '%FAILED%' 
   AND timestamp > NOW() - INTERVAL '7 days';
   ```

3. **Recovery**:
   - Reset admin passwords
   - Clear all sessions if needed
   - Update security configurations
   - Patch any identified vulnerabilities

## 📊 Regular Maintenance

### Daily:
- [ ] Check security dashboard for anomalies
- [ ] Review critical security events
- [ ] Monitor failed login attempts

### Weekly:
- [ ] Review audit logs
- [ ] Check for new security vulnerabilities
- [ ] Update dependencies if needed

### Monthly:
- [ ] Rotate JWT secrets (optional, invalidates sessions)
- [ ] Review and update security configurations
- [ ] Test backup and recovery procedures

---

**🎉 Ready to run your contest?** Start with `npm run setup:production` and launch your competition platform!

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: August 13, 2025  
**Build Status**: ✅ All TypeScript errors resolved, ready for Vercel deployment
