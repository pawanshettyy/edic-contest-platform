# Techpreneur 3.0 Summit Platform

A modern, scalable innovation challenge platform built with Next.js 15, TypeScript, and PostgreSQL. Designed for the Techpreneur 3.0 Summit - a 3-day entrepreneurship event with team-based challenges across 3 rounds including innovation quizzes, voting, and results.

## 🚀 Features

- **Team-based Authentication**: Secure team registration and login
- **Multi-round Contest System**: Quiz, Voting, and Results phases
- **Real-time Progress Tracking**: Dynamic status updates and qualification tracking
- **Responsive Design**: Works on all devices with dark/light theme support
- **Production Ready**: Optimized for deployment on Vercel with PostgreSQL backend

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL, JWT Authentication
- **Database**: PostgreSQL with full schema and indexing
- **Deployment**: Vercel-optimized with environment configuration
- **Security**: bcrypt password hashing, HTTP-only cookies, CORS protection

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud)
- Vercel account (for deployment)

## 🏃‍♂️ Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd edic-contest-platform
npm install
```

### 2. Environment Setup

```bash
# Copy environment file
cp .env.example .env.local

# Edit .env.local with your database credentials
DATABASE_URL="postgresql://user:password@localhost:5432/edic_contest"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
```

### 3. Database Setup

```bash
# Create database and run schema
psql -d your_database -f database/schema.sql
```

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🚀 Deployment Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions.

## 🎯 Contest System

### Round 1: Quiz Phase
- Multiple choice questions with automatic scoring
- Real-time progress tracking and qualification

### Round 2: Voting Phase  
- Team voting with rating/ranking system
- Qualification for final round

### Round 3: Results Phase
- Final rankings and score breakdowns
- Team achievement status

## 🔐 Authentication

- Team-based registration with leader email
- Shared team password for member access
- JWT tokens with HTTP-only cookies
- Secure password hashing with bcrypt

## 📊 API Endpoints

- `POST /api/auth/signup` - Team registration
- `POST /api/auth/signin` - Team authentication  
- `POST /api/auth/signout` - Logout
- `GET /api/auth/me` - Current user/team info
- `GET /api/health` - System health check

## 🗄️ Database Schema

Complete PostgreSQL schema with tables for users, teams, contest rounds, progress tracking, quizzes, voting, and results. See `database/schema.sql` for full structure.

Built with ❤️ for competitive programming and team contests.
