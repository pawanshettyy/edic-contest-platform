// lib/api-cleanup.md
# API Cleanup Documentation

## Current API Endpoints Analysis

### Used Endpoints (Keep):
1. `/api/admin/auth/signin` - Admin authentication
2. `/api/admin/auth/signout` - Admin logout  
3. `/api/admin/auth/me` - Admin session check
4. `/api/admin/teams` - Team management
5. `/api/admin/config` - Contest configuration
6. `/api/admin/monitor` - Real-time monitoring
7. `/api/admin/logs` - Admin activity logs
8. `/api/voting` - Voting system
9. `/api/quiz` - Quiz system
10. `/api/scoreboard` - Results/scoring
11. `/api/health` - System health check

### Unused/Duplicate Endpoints (Remove):
1. `/api/admin/instant-access` - SECURITY RISK - Remove immediately
2. `/api/admin/users` - Not used in current features
3. `/api/admin/overview` - Duplicate of monitor
4. `/api/auth/signin` - Regular user auth (not implemented)
5. `/api/auth/signup` - Regular user auth (not implemented)
6. `/api/auth/signout` - Regular user auth (not implemented)  
7. `/api/auth/me` - Regular user auth (not implemented)

### Database Integration Status:
- Currently using mock data in admin dashboard
- Need to connect to optimized database schema
- Replace hardcoded responses with real queries

### Security Issues Found:
1. Instant access endpoint bypasses authentication
2. Some endpoints missing proper validation
3. JWT secrets need environment configuration
4. Admin session management needs improvement

### Next Steps:
1. Remove unused endpoints
2. Update remaining endpoints to use optimized database
3. Add proper error handling and validation
4. Implement real-time features
5. Add rate limiting and security headers
