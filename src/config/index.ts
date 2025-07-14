export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    read_username: process.env.DB_READ_USERNAME || 'read',
    read_password: process.env.DB_READ_PASSWORD || '',
    read_write_username: process.env.DB_READ_WRITE_USERNAME || 'read_write',
    read_write_password: process.env.DB_READ_WRITE_PASSWORD || '',
    database: process.env.DB_DATABASE || 'db',
    ssl_connection: process.env.DB_SSL_CONNECTION === 'true',
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
    timer: process.env.LOG_TIMER === 'true',
  }
};
