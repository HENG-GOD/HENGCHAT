export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },
  encryption: {
    // 32-byte hex string used to AES-256-GCM encrypt channel secrets/tokens
    key: process.env.ENCRYPTION_KEY ?? '',
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'hengchat-media',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
  },
  line: {
    apiBaseUrl: process.env.LINE_API_BASE_URL ?? 'https://api.line.me',
    dataApiBaseUrl: process.env.LINE_DATA_API_BASE_URL ?? 'https://api-data.line.me',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
  },
});
