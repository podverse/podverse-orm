import { EntityManager, FindOneOptions, FindOptionsWhere, ObjectLiteral, Repository } from "typeorm";
import { AppDataSourceRead, AppDataSourceReadWrite } from "@orm/db";
import { applyProperties } from "@orm/lib/applyProperties";
import { hasDifferentValues } from "@orm/lib/hasDifferentValues";
import { loggerService } from "@orm/factories/loggerService";

export class BaseOneService<T extends ObjectLiteral, K extends keyof T> {
  private parentEntityKey: K;
  protected repositoryRead: Repository<T>;
  protected repositoryReadWrite: Repository<T>;
  private transactionalEntityManager?: EntityManager;

  constructor(entity: { new (): T }, parentEntityKey: K, transactionalEntityManager?: EntityManager) {
    this.parentEntityKey = parentEntityKey;
    this.repositoryRead = AppDataSourceRead.getRepository(entity) as Repository<T>;
    this.repositoryReadWrite = AppDataSourceReadWrite.getRepository(entity) as Repository<T>;
    this.transactionalEntityManager = transactionalEntityManager;
  }

  async _get(parentEntity: T[K], config?: FindOneOptions<T>): Promise<T | null> {
    const where: FindOptionsWhere<T> = { [this.parentEntityKey]: { id: parentEntity.id } } as FindOptionsWhere<T>;
    return this.repositoryRead.findOne({ where, ...config });
  }

  async _update(parentEntity: T[K], dto: Partial<T>, config?: FindOneOptions<T>): Promise<T> {
    let entity = await this._get(parentEntity, config);

    if (!entity) {
      entity = new (this.repositoryReadWrite.target as { new (): T })();
      entity[this.parentEntityKey] = parentEntity;
    } else if (!hasDifferentValues(entity, dto)) {
      return entity;
    }

    entity = applyProperties(entity, dto);
    loggerService.debug(`Updating entity ${JSON.stringify(entity)}`);
    loggerService.debug(`With DTO ${JSON.stringify(dto)}`);

    return (this.transactionalEntityManager as EntityManager
      ?? this.repositoryReadWrite).save(entity);
  }

  public async _delete(parentEntity: T[K]): Promise<void> {
    const rowToDelete = await this._get(parentEntity);
    if (rowToDelete) {
      await this.repositoryReadWrite.remove(rowToDelete);
    }
  }
}
