import { parseIntOrDefault } from "podverse-shared"

// TODO: pass in config
export const config = {
  db: {
    type: process.env.DB_TYPE || '',
    host: process.env.DB_HOST || '',
    port: parseIntOrDefault(process.env.DB_PORT, 5432),
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
  superUserId: process.env.SUPER_USER_ID || '',
  userAgent: process.env.USER_AGENT || '',
  website: {
    domain: process.env.WEBSITE_DOMAIN || '',
    protocol: process.env.WEBSITE_PROTOCOL || ''
  }
}
