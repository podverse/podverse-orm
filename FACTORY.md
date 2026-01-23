# Factory Function: createORMContext

## Overview

The `createORMContext` function is the factory function for creating an ORM (Object-Relational Mapping) context. This function sets up TypeORM DataSources for both read-only and read-write database connections, along with a logger service.

**Important**: The DataSources returned by this function are **NOT initialized**. You must call `dataSourceRead.initialize()` and `dataSourceReadWrite.initialize()` after creating the context.

## Function Signature

```typescript
export function createORMContext(config: ORMConfig): ORMContext
```

## Parameters

### `config: ORMConfig` (Required)

The ORM configuration object with the following structure:

#### `database: DatabaseConfig` (Required)

Database connection configuration:

- **`host: string`** (Required) - Database hostname
- **`port: number`** (Required) - Database port number
- **`read_username: string`** (Required) - Username for read-only database connection
- **`read_password: string`** (Required) - Password for read-only database connection
- **`read_write_username: string`** (Required) - Username for read-write database connection
- **`read_write_password: string`** (Required) - Password for read-write database connection
- **`database: string`** (Required) - Database name
- **`ssl_connection: boolean`** (Required) - Whether to use SSL for database connections

#### `log: LogConfig` (Required)

Logging configuration:

- **`level: string`** (Required) - Log level (e.g., `'info'`, `'debug'`, `'error'`)
- **`dir?: string`** (Optional) - Log directory path
- **`timer?: boolean`** (Optional) - Enable log timers

#### `defaults: DefaultsConfig` (Required)

Default configuration values:

- **`account.settings.locale: string`** (Required) - Default locale for account settings
  - Must be a valid locale from supported locales

#### `nodeEnv?: string` (Optional)

Node environment identifier (e.g., `'development'`, `'production'`)

## Return Type

### `ORMContext`

Returns an object with the following properties:

- **`config: ORMConfig`** - The configuration object that was passed in
- **`dataSourceRead: DataSource`** - TypeORM DataSource for read-only operations (not initialized)
- **`dataSourceReadWrite: DataSource`** - TypeORM DataSource for read-write operations (not initialized)
- **`loggerService: LoggerService`** - Logger service instance

## Important Notes

### DataSource Initialization

**CRITICAL**: The DataSources are **NOT initialized** when returned from this function. You must initialize them separately:

```typescript
const ormContext = createORMContext(config);

// Initialize DataSources
await ormContext.dataSourceRead.initialize();
await ormContext.dataSourceReadWrite.initialize();
```

### Module-Level Context

This function sets the module-level context via `setORMContext()`, which allows services within the ORM module to access the DataSources and logger without needing to pass them explicitly.

### Database Configuration

- The function creates two separate DataSources: one for read-only operations and one for read-write operations
- Both DataSources share the same connection settings (host, port, database) but use different credentials
- The database type is hardcoded to `"postgres"` (PostgreSQL)
- The naming strategy is set to `SnakeNamingStrategy` (converts camelCase to snake_case)

## Dependencies

This factory function has no dependencies on other factory functions. It can be called independently.

## Example Usage

```typescript
import { createORMContext } from 'podverse-orm';

// Build configuration from environment variables
const ormConfig = {
  nodeEnv: process.env.NODE_ENV,
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    read_username: process.env.DB_READ_USERNAME!,
    read_password: process.env.DB_READ_PASSWORD!,
    read_write_username: process.env.DB_READ_WRITE_USERNAME!,
    read_write_password: process.env.DB_READ_WRITE_PASSWORD!,
    database: process.env.DB_DATABASE!,
    ssl_connection: process.env.DB_SSL_CONNECTION === 'true',
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR,
    timer: process.env.LOG_TIMER === 'true',
  },
  defaults: {
    account: {
      settings: {
        locale: process.env.DEFAULT_ACCOUNT_SETTINGS_LOCALE!,
      }
    }
  }
};

// Create ORM context
const ormContext = createORMContext(ormConfig);

// Initialize DataSources
await ormContext.dataSourceRead.initialize();
await ormContext.dataSourceReadWrite.initialize();

// Now you can use the DataSources
const repository = ormContext.dataSourceReadWrite.getRepository(SomeEntity);
```

## Related Files

- **Factory implementation**: `src/factory.ts`
- **Configuration types**: `src/config/types.ts`
- **Context management**: `src/context.ts`
- **Entities**: `src/db/entities.ts`
