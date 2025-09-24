import { EntityManager, FindOneOptions, FindManyOptions } from 'typeorm';
import { Clip } from '@orm/entities/clip';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { AccountService } from '@orm/services/account/account';
import { ItemService } from './item/item';

export type ClipDto = {
  start_time: string;
  end_time?: string | null;
  title?: string | null;
  description?: string | null;
  item_id_text: string;
  sharable_status_id: number;
};

export class ClipService extends BaseManyService<Clip, 'account'> {
  private accountService: AccountService;
  private itemService: ItemService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(Clip, 'account', transactionalEntityManager);
    this.accountService = new AccountService();
    this.itemService = new ItemService();
  }

  async create(account_id: number, dto: ClipDto): Promise<Clip> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const item = await this.itemService.getByIdOrIdText(dto.item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    if (dto.end_time && parseFloat(dto.end_time) <= parseFloat(dto.start_time)) {
      throw new Error("End time must be greater than start time.");
    }

    const finalDto = {
      start_time: dto.start_time,
      end_time: dto.end_time || null,
      title: dto.title || null,
      description: dto.description || null,
      account,
      item,
      sharable_status_id: dto.sharable_status_id
    };

    const whereKeys = [] as (keyof Clip)[];
    return this._update(account, whereKeys, finalDto);
  }

  async update(account_id: number, clip_id_text: string, dto: ClipDto): Promise<Clip> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const clip = await this._get(account, { id_text: clip_id_text });
    if (!clip) {
      throw new Error("Clip not found.");
    }

    const item = await this.itemService.getByIdOrIdText(dto.item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    if (dto.end_time && parseFloat(dto.end_time) <= parseFloat(dto.start_time)) {
      throw new Error("End time must be greater than start time.");
    }

    const finalDto = {
      start_time: dto.start_time,
      end_time: dto.end_time || null,
      title: dto.title || null,
      description: dto.description || null,
      item,
      sharable_status_id: dto.sharable_status_id
    };

    const whereKeys = ['id_text'] as (keyof Clip)[];
    return this._update(account, whereKeys, finalDto, undefined, clip);
  }

  async delete(account_id: number, clip_id_text: string): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._delete(account, { id_text: clip_id_text });
  }

  async getByIdText(clip_id_text: string, config?: FindOneOptions<Clip>): Promise<Clip | null> {
    const options: FindOneOptions<Clip> = {
      where: { id_text: clip_id_text },
      ...config
    };

    return this.repositoryRead.findOne(options);
  }

  async getMany(options?: FindManyOptions<Clip>): Promise<Clip[]> {
    return this.repositoryRead.find(options);
  }

  async getManyAndCount(options?: FindManyOptions<Clip>): Promise<[Clip[], number]> {
    return this.repositoryRead.findAndCount(options);
  }

  async getManyByAccount(account_id: number): Promise<Clip[]> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._getAll(account);
  }
}
