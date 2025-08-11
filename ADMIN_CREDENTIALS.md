# 🔐 Admin Credentials

This file contains the login credentials for all administrator accounts in the EDIC Contest Platform.

**⚠️ SECURITY WARNING: Keep this file secure and do not commit it to version control!**

## Admin User Accounts

### 1. Super Administrator
- **Username**: `superadmin`
- **Password**: `SuperAdmin@2025`
- **Email**: `superadmin@techpreneur3.com`
- **Role**: `super_admin`
- **Permissions**: Full access to all features
- **Use Case**: Primary system administrator with complete control

### 2. Contest Administrator
- **Username**: `admin_contest`
- **Password**: `Contest#Admin123`
- **Email**: `contest@techpreneur3.com`
- **Role**: `contest_admin`
- **Permissions**: Teams, Configuration, Questions, Monitoring
- **Use Case**: Managing contest flow, teams, and questions

### 3. Technical Administrator
- **Username**: `admin_tech`
- **Password**: `TechAdmin$456`
- **Email**: `tech@techpreneur3.com`
- **Role**: `tech_admin`
- **Permissions**: Configuration, Monitoring, Logs
- **Use Case**: Technical support and system monitoring

### 4. Judge Administrator
- **Username**: `admin_judge`
- **Password**: `Judge&Panel789`
- **Email**: `judge@techpreneur3.com`
- **Role**: `judge_admin`
- **Permissions**: Teams, Monitoring
- **Use Case**: Judging panel and team evaluation

### 5. Backup Administrator
- **Username**: `admin_backup`
- **Password**: `Backup!Admin999`
- **Email**: `backup@techpreneur3.com`
- **Role**: `backup_admin`
- **Permissions**: Teams, Configuration, Monitoring
- **Use Case**: Emergency access and backup operations

## Access Levels

### Permission Matrix
| Feature | Super Admin | Contest Admin | Tech Admin | Judge Admin | Backup Admin |
|---------|------------|---------------|------------|-------------|--------------|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Team Management | ✅ | ✅ | ❌ | ✅ | ✅ |
| Question Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configuration | ✅ | ✅ | ✅ | ❌ | ✅ |
| System Monitoring | ✅ | ✅ | ✅ | ✅ | ✅ |
| System Logs | ✅ | ❌ | ✅ | ❌ | ❌ |
| All Features | ✅ | ❌ | ❌ | ❌ | ❌ |

## Login Instructions

1. Navigate to `/admin/login` in your browser
2. Enter the username and password from above
3. Click "Sign In"
4. You will be redirected to the admin dashboard

## Security Guidelines

- **Change passwords immediately** after first login
- **Use strong, unique passwords** for each account
- **Enable two-factor authentication** when available
- **Limit access** to only necessary personnel
- **Monitor login activities** regularly
- **Rotate passwords** every 90 days

## Emergency Access

In case of emergency:
1. Use the **Super Administrator** account for full access
2. Use the **Backup Administrator** account as secondary option
3. Contact the technical team if all accounts are compromised

## Password Reset

If you need to reset any password:
1. Run the password reset script: `npm run admin:reset-password`
2. Or contact the system administrator
3. Or use the database reset utilities

---

**Last Updated**: August 10, 2025  
**Created By**: System Administrator  
**Security Level**: CONFIDENTIAL

⚠️ **DO NOT SHARE THESE CREDENTIALS PUBLICLY**
