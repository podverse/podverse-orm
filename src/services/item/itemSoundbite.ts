import { EntityManager, FindOneOptions } from 'typeorm';
import { Item } from '@orm/entities/item/item';
import { ItemSoundbite } from '@orm/entities/item/itemSoundbite';
import { BaseManyService } from '@orm/services/base/baseManyService';

type ItemSoundbiteDto = {
  start_time: string
  duration: string
  title: string | null
}

export class ItemSoundbiteService extends BaseManyService<ItemSoundbite, 'item'> {
  constructor(transactionalEntityManager?: EntityManager) {
    super(ItemSoundbite, 'item', transactionalEntityManager);
  }

  async getByIdText(id_text: string, config?: FindOneOptions<ItemSoundbite>): Promise<ItemSoundbite | null> {
    const options: FindOneOptions<ItemSoundbite> = {
      where: { id_text },
      ...config
    };

    return this.repositoryRead.findOne(options);
  }

  async update(item: Item, dto: ItemSoundbiteDto): Promise<ItemSoundbite> {
    const whereKeys = ['start_time', 'duration'] as (keyof ItemSoundbite)[];
    return super._update(item, whereKeys, dto);
  }

  async updateMany(item: Item, dtos: ItemSoundbiteDto[]): Promise<ItemSoundbite[]> {
    const whereKeys = ['start_time', 'duration'] as (keyof ItemSoundbite)[];
    return super._updateMany(item, whereKeys, dtos);
  }

  async deleteAll(item: Item): Promise<void> {
    return super._deleteAll(item);
  }
}
