# Admin System Documentation

The contest platform includes a secure admin system for managing competitions, teams, and real-time oversight.

## Admin Features

### 🔐 Authentication & Security
- **Database-only authentication** with username and password
- Secure JWT-based sessions with HTTP-only cookies
- Session management with automatic expiration (8 hours)
- IP address tracking and comprehensive audit logging
- Protected admin routes with middleware validation

## Database-Only Admin Access

**Important:** Admin access is **only available through database-stored accounts**. There are no hardcoded keys or bypass methods.

### Creating Admin Users

1. **Set up your database** using the provided schema files
2. **Run the admin creation script:**
   ```sql
   -- Execute: database/create-admin-users.sql
   ```
3. **Default admin account will be created:**
   - **Username:** `admin`
   - **Password:** `admin123`
   - **Role:** `super_admin`

### Admin Account Management

Admin accounts must be created by:
- Running SQL scripts directly on the database
- Using database administration tools
- Having existing super_admin users create new accounts

**No signup form is provided** - this ensures only authorized database administrators can create admin accounts.

### 📊 Dashboard Overview
- Real-time statistics: total users, teams, submissions
- Active contest rounds monitoring
- Top teams leaderboard
- System health status
- Recent admin activity logs

### 👥 Team Management
- View all registered teams with pagination and search
- Update team scores (current and total)
- Change team rounds
- Add time penalties with reasons
- Activate/deactivate teams
- Filter by round and sort by various criteria

### ⚙️ Contest Configuration
- Manage contest rounds (create, update, activate)
- Configure platform settings
- Set timing and limits
- Real-time configuration updates

### 📈 Real-time Monitoring
- Live submission tracking
- Team progress monitoring
- System performance metrics
- Audit trail of all admin actions

## Database Schema

### Admin Tables
```sql
-- Admin users with role-based permissions
admin_users (id, username, email, password_hash, role, permissions, is_active, last_login, created_at, updated_at)

-- Secure session management
admin_sessions (id, admin_user_id, session_token, ip_address, user_agent, created_at, last_activity, expires_at)

-- Contest configuration
contest_config (id, key, value, description, is_active, updated_by, created_at, updated_at)

-- Comprehensive audit logging
admin_logs (id, admin_user_id, action, details, ip_address, created_at)

-- System announcements
announcements (id, title, message, type, is_active, created_by, created_at, updated_at, expires_at)

-- Team penalties tracking
team_penalties (id, team_id, reason, penalty_minutes, applied_by, applied_at)

-- System metrics
system_metrics (id, metric_name, metric_value, metric_type, recorded_at)
```

## API Endpoints

### Authentication
- `POST /api/admin/auth/signin` - Admin login
- `POST /api/admin/auth/signout` - Admin logout  
- `GET /api/admin/auth/me` - Get current admin session

### Management
- `GET /api/admin/overview` - Dashboard statistics
- `GET /api/admin/teams` - List teams with filters
- `POST /api/admin/teams` - Team management actions
- `GET /api/admin/config` - Get configuration
- `POST /api/admin/config` - Update configuration

## Admin Routes

### Public Access
- `/admin` - Redirects to login
- `/admin/login` - Admin authentication

### Protected Routes (requires admin session)
- `/admin/dashboard` - Main admin interface
- `/admin/teams` - Team management (planned)
- `/admin/config` - Contest configuration (planned)
- `/admin/monitor` - Real-time monitoring (planned)

## Default Admin Credentials

**Username:** `admin`  
**Password:** `admin123`  
**Role:** `super_admin`

> ⚠️ **Security Note:** Change default credentials immediately in production!

## How to Access Admin Panel

1. **Ensure database is set up** with admin schema
2. **Run admin creation script** to create admin users
3. **Visit admin login:** http://localhost:3001/admin/login
4. **Enter database admin credentials** (username/password only)

## Security Features

### Database-Only Authentication
- No hardcoded access keys or bypass methods
- All admin accounts must exist in the database
- Password verification using bcrypt hashing
- No registration - admin accounts created via database only

Ensure these environment variables are set:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT Secret (change in production)
JWT_SECRET="your-super-secure-secret-key"

# Node Environment
NODE_ENV="production"
```

## Security Features

### Session Management
- HTTP-only cookies prevent XSS attacks
- Strict SameSite policy
- Automatic session cleanup
- IP address validation

### Audit Logging
- All admin actions logged with details
- IP address and timestamp tracking
- User identification for accountability
- Automatic cleanup of old logs

### Role-Based Access
- Configurable permissions system
- Role hierarchy support
- Action-level permission checks
- Future-ready for multiple admin roles

## Production Deployment

### Database Setup
1. Run the main schema: `database/schema.sql`
2. Run the admin schema: `database/admin-schema.sql`
3. Update default admin credentials
4. Configure proper database permissions

### Security Checklist
- [ ] Change default admin credentials
- [ ] Set strong JWT_SECRET
- [ ] Configure HTTPS
- [ ] Set up database backups
- [ ] Enable audit log monitoring
- [ ] Configure rate limiting
- [ ] Set up monitoring alerts

### Performance Considerations
- Admin queries are optimized with proper indexing
- Session cleanup runs automatically
- Pagination prevents large data loads
- Real-time updates use efficient queries

## Usage Examples

### Team Management
```javascript
// Update team score
POST /api/admin/teams
{
  "action": "update_score",
  "teamId": "uuid",
  "data": {
    "currentScore": 150,
    "totalScore": 450
  }
}

// Add penalty
POST /api/admin/teams  
{
  "action": "add_penalty",
  "teamId": "uuid", 
  "data": {
    "reason": "Late submission",
    "minutes": 30
  }
}
```

### Configuration Updates
```javascript
// Update contest setting
POST /api/admin/config?action=update_config
{
  "key": "max_teams",
  "value": "1000", 
  "description": "Maximum number of teams allowed"
}

// Update contest round
POST /api/admin/config?action=update_round
{
  "roundNumber": 1,
  "title": "Qualification Round",
  "isActive": true,
  "timeLimit": 180
}
```

## Future Enhancements

### Planned Features
- Real-time dashboard with WebSocket updates
- Advanced analytics and reporting
- Bulk team operations
- Custom announcement system
- Export functionality for results
- Mobile-responsive admin interface
- Multi-language support
- Advanced permission management

### Integration Points
- Email notification system
- External contest platforms
- Real-time leaderboard updates
- Automated scoring systems
- Backup and restore utilities

## Support

For admin system issues:
1. Check the admin logs table for error details
2. Verify database connections
3. Check JWT token configuration
4. Review middleware settings
5. Validate environment variables

The admin system is designed for scalability and can handle thousands of teams with real-time updates and comprehensive oversight capabilities.
