import { Connection as ConnectionTypeORM, getConnection as getConnectionTypeORM } from "typeorm"

export const getConnection = () => {
  return getConnectionTypeORM()
}

export type Connection = ConnectionTypeORM
