# EDIC Contest Platform

A modern contest management platform for internal club competitions. Built with Next.js, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Setup
```bash
git clone <repo-url>
cd edic-contest-platform
npm install
```

### Environment Configuration
```bash
cp .env.example .env.local
# Edit .env.local with your database credentials
```

### Database Setup
```bash
# Run the database schema
psql -d your_database -f database/optimized-schema.sql
```

### Development
```bash
npm run dev
# Visit http://localhost:3000
```

## 🏆 Features

### Contest System
- **Multi-round Contests**: Quiz → Voting → Results
- **Team Management**: Team registration and authentication
- **MCQ Quiz System**: 15 questions max, 1 minute each
- **Voting System**: Peer voting for presentations
- **Live Scoreboard**: Real-time results and rankings

### Admin Dashboard
- **Question Bank**: Create and manage quiz questions (max 15)
- **Team Management**: View, edit, and manage teams
- **Contest Configuration**: Set up rounds and timing
- **Real-time Monitoring**: Live contest statistics
- **Activity Logs**: Complete audit trail

## 🔐 Admin Access

**Default Credentials:**
- Username: `admin` 
- Password: `admin123`
- URL: `/admin/login`

⚠️ **Change password immediately after first login!**

## 📊 Contest Flow

1. **Setup Phase**
   - Admin creates questions (max 15, 1 min each)
   - Teams register with team codes
   - Configure contest settings

2. **Quiz Round**
   - Teams answer MCQ questions
   - Points awarded for correct answers
   - Real-time progress tracking

3. **Voting Round**
   - Teams present to peers
   - Peer voting system
   - Qualification based on votes

4. **Results**
   - Final rankings and scores
   - Team achievements

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, PostgreSQL
- **UI**: Tailwind CSS, Shadcn/ui components
- **Security**: JWT authentication, bcrypt hashing

## 🚀 Deployment

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel login
vercel
```

### Option 2: Self-hosted
```bash
npm run build
npm run start
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secure-32-character-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## 📋 Database Options

- **Neon**: Free PostgreSQL hosting
- **Supabase**: Free tier with web interface
- **Railway**: Simple deployment
- **Local PostgreSQL**: For development

## 🔧 Administration

### Question Management
- Maximum 15 questions per contest
- Each question = 1 minute duration
- Categories: Finance, Innovation, Marketing, etc.
- Multiple choice with point scoring

### Team Management
- Team registration with codes
- Score adjustments and penalties
- Real-time status monitoring
- Export results

### Security Features
- JWT-based authentication
- IP address logging
- Admin activity audit trail
- Secure password storage

## 📈 System Requirements

- Node.js 18+
- PostgreSQL 12+
- 512MB RAM minimum
- 1GB storage for logs

## 🐛 Common Issues

1. **Database Connection**: Check DATABASE_URL format
2. **Build Errors**: Run `npm run build` to test
3. **Admin Access**: Verify credentials and JWT_SECRET
4. **Question Limit**: Maximum 15 questions enforced

## 📞 Support

For club members:
1. Check admin logs for errors
2. Verify database connection
3. Test with default setup
4. Contact tech team if needed

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Built for**: Internal Club Contests
