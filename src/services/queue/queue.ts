import { MediumEnum } from 'podverse-helpers';
import { EntityManager, FindManyOptions, FindOneOptions } from 'typeorm';
import { Queue } from '@orm/entities/queue/queue';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { AccountService } from '@orm/services/account/account';

export type QueueDto = {
  medium: MediumEnum;
};

export class QueueService extends BaseManyService<Queue, 'account'> {
  private accountService: AccountService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(Queue, 'account', transactionalEntityManager);
    this.accountService = new AccountService();
  }

  async create(account_id: number, dto: QueueDto): Promise<Queue> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const whereKeys = [] as (keyof Queue)[];
    return this._update(account, whereKeys, dto);
  }

  async getByIdText(queue_id_text: string, config?: FindOneOptions<Queue>): Promise<Queue | null> {
    return this.repositoryRead.findOne({
      where: {
        id_text: queue_id_text
      },
      ...config
    });
  }

  async getAllPrivate(account_id: number, config?: FindManyOptions<Queue>): Promise<Queue[]> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._getAll(account, config);
  }
}
