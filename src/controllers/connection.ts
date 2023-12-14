import { getConnection as getConnectionTypeORM } from "typeorm"

export const getConnection = () => {
  return getConnectionTypeORM()
}
