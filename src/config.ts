// TODO: pass in config
export const config = {
  db: {
    type: process.env.DB_TYPE || '',
    host: process.env.DB_HOST || '',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || '',
    sslConnection: false
  },
  manticore: {
    domain: process.env.MANTICORE_DOMAIN || '',
    port: process.env.MANTICORE_PORT || 9308,
    protocol: process.env.MANTICORE_PROTOCOL || 'http'
  },
  userAgent: process.env.USER_AGENT || ''
}
