# 🏆 EDIC Contest Platform

A comprehensive contest management platform for entrepreneurship competitions. Built with **Next.js 15**, **TypeScript**, and **PostgreSQL** with modern authentication and real-time features.

![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Next.js](https://img.shields.io/badge/next.js-15.4.4-blueviolet.svg)

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
├── voting_items (presentation submissions)
├── team_votes (voting results)
└── contest_config (system configuration)
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
npm run setup:production   # Set up production database
npm run setup:development  # Set up development database
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

## 🚀 Deployment

### Production Deployment (Vercel - Recommended)

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

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check database URL format
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Test connection
npm run setup:development
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

## 🔐 Security

### Production Security Checklist

- [ ] Change default admin passwords
- [ ] Use HTTPS in production
- [ ] Set secure JWT secret (32+ characters)
- [ ] Enable CORS protection
- [ ] Regular security updates
- [ ] Monitor admin activity logs

### Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: HTTP-only cookies
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Input sanitization
- **CSRF Protection**: SameSite cookies

## 📈 Monitoring

### Built-in Analytics

- Real-time team participation
- Quiz completion rates
- Voting engagement metrics
- Admin activity tracking

### Health Checks

- Database connectivity monitoring
- API endpoint health checks
- System performance metrics

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

**🎉 Ready to run your contest?** Start with `npm run setup:production` and launch your competition platform!

**Version**: 1.0.0
**Status**: Production Ready ✅
**Last Updated**: August 10, 2025
