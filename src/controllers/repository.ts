import { EntityTarget, getRepository as getRepositoryTypeORM } from "typeorm"

export const getRepository = (target: EntityTarget<unknown>) => {
  return getRepositoryTypeORM(target)
}
