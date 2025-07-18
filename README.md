<<<<<<< HEAD
# Finovix
A Premium Accounting System
=======
# Burhani Accounts - PVC Manufacturing Accounting System

A comprehensive accounting and business management system designed specifically for PVC pipe manufacturing companies.

## Features

- **Financial Management**: Bills, expenses, and financial reporting
- **Employee Management**: Staff records, attendance tracking, and payroll
- **Security**: Enhanced authentication with leaked password protection
- **Reports**: Comprehensive business analytics and tax summaries
- **Multi-currency Support**: Configurable currency and localization settings

## Security Features

### Enhanced Authentication
- **Leaked Password Protection**: Integration with HaveIBeenPwned.org to prevent use of compromised passwords
- **Strong Password Requirements**: Enforced password complexity rules
- **Email Verification**: Required email confirmation for new accounts
- **Session Management**: Secure session handling with proper timeouts
- **Audit Logging**: Comprehensive logging of authentication events

### Data Protection
- **Row Level Security (RLS)**: Database-level access controls
- **Encrypted Storage**: All sensitive data is encrypted at rest
- **Secure API**: Protected endpoints with proper authentication
- **CORS Configuration**: Properly configured cross-origin resource sharing

## Setup Instructions

### 1. Supabase Configuration

#### Enable Security Features in Dashboard:
1. Go to Supabase Dashboard → Authentication → Settings
2. Enable the following security features:
   - **Leaked Password Protection**: ✅ Enabled
   - **Email Confirmation**: ✅ Required
   - **Minimum Password Length**: 8 characters
   - **Session Timeout**: 24 hours
   - **Refresh Token Rotation**: ✅ Enabled

#### Rate Limiting:
- Configure rate limiting for authentication endpoints
- Set appropriate limits for login attempts (e.g., 5 attempts per 15 minutes)

#### CORS Settings:
- Configure allowed origins for your domain
- Set appropriate headers for security

### 2. Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the migrations in order:
1. `20250622085221_mute_island.sql` - Employee management
2. `20250622085310_foggy_thunder.sql` - Expense tracking
3. `20250622085451_fading_firefly.sql` - Bill management
4. `20250628120401_holy_palace.sql` - User settings
5. `20250628120558_bold_cave.sql` - Additional settings
6. `20250628130000_enable_auth_security.sql` - Security enhancements

### 4. Installation

```bash
npm install
npm run dev
```

## Security Best Practices

### For Administrators:
1. **Regular Security Audits**: Review authentication logs regularly
2. **Monitor Failed Attempts**: Watch for suspicious login patterns
3. **Update Dependencies**: Keep all packages up to date
4. **Backup Strategy**: Implement regular database backups
5. **Access Reviews**: Regularly review user access permissions

### For Users:
1. **Strong Passwords**: Use unique, complex passwords
2. **Email Verification**: Always verify your email address
3. **Secure Devices**: Only access from trusted devices
4. **Regular Updates**: Keep your browser updated
5. **Report Issues**: Report any suspicious activity immediately

## Compliance

This system implements security measures to help with:
- **Data Protection**: GDPR-compliant data handling
- **Financial Regulations**: Audit trails for financial transactions
- **Industry Standards**: Following security best practices
- **Access Controls**: Proper user permission management

## Support

For security-related issues or questions:
- Email: security@burhaniaccounts.com
- Documentation: Check the security section in settings
- Emergency: Contact system administrator immediately

## License

This project is proprietary software. All rights reserved.

---

**Security Notice**: This system includes enhanced security features including leaked password protection. Users are required to use strong, unique passwords that have not been compromised in data breaches.
>>>>>>> 753ce3f (Initial commit)
