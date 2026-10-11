const parseAllowedOrigins = (value?: string) => value
  ? value.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const defaultCorsOrigins = isProduction ? [] : ['http://localhost:5173'];
const corsOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN).length > 0
  ? parseAllowedOrigins(process.env.CORS_ORIGIN)
  : defaultCorsOrigins;

const requiredInProduction = [
  ['JWT_SECRET', process.env.JWT_SECRET, 'replace-with-a-long-random-secret'],
  ['DATABASE_URL', process.env.DATABASE_URL, 'file:./dev.db'],
  ['APP_URL', process.env.APP_URL, 'http://localhost:5173'],
];

for (const [name, value, placeholder] of requiredInProduction) {
  if (isProduction && (!value || value === placeholder || value.includes('replace-with'))) {
    throw new Error(`Missing or insecure production value for ${name}. Please set it in environment variables.`);
  }
}

if (isProduction && corsOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must be set in production.');
}

export const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins,
  corsOrigin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@topshelfexotics.com',
  smtpFromName: process.env.SMTP_FROM_NAME || 'Top Shelf Exotics',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  appleClientId: process.env.APPLE_CLIENT_ID || '',
  appleTeamId: process.env.APPLE_TEAM_ID || '',
  appleKeyId: process.env.APPLE_KEY_ID || '',
  applePrivateKey: process.env.APPLE_PRIVATE_KEY || '',
};