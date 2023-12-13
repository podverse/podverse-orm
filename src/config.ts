// TODO: pass in config
export const config = {
  manticore: {},
  userAgent: 'Podverse/ORM Service',
  db: {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'mysecretpw',
    database: 'postgres',
    sslConnection: false
  }
} as any
