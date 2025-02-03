import { FindManyOptions, FindOneOptions, IsNull, Not, Repository } from 'typeorm';
import { Channel } from '@orm/entities/channel/channel';
import { Item } from '@orm/entities/item/item';
import { applyProperties } from '@orm/lib/applyProperties';
import { AppDataSourceRead, AppDataSourceReadWrite } from '@orm/db';

type ItemDto = {
  title: string | null
  pubdate: Date | null
  guid: string | null
  guid_enclosure_url: string | null
}

type ItemGetByDto = {
  guid: string | null
  guid_enclosure_url: string | null
}

export class ItemService {
  protected repositoryRead: Repository<Item>;
  protected repositoryReadWrite: Repository<Item>;

  constructor() {
    this.repositoryRead = AppDataSourceRead.getRepository(Item);
    this.repositoryReadWrite = AppDataSourceReadWrite.getRepository(Item);
  }

  async get(id: number, config?: FindOneOptions<Item>): Promise<Item | null> {
    if (!id) {
      return null;
    }
    return this.repositoryRead.findOne({ where: { id }, ...config });
  }

  async _getByIdText(id_text: string, config?: FindOneOptions<Item>): Promise<Item | null> {
    if (!id_text) {
      return null;
    }
    return this.repositoryRead.findOne({ where: { id_text }, ...config });
  }

  async getByIdOrTextId(idOrIdText: string, config?: FindOneOptions<Item>): Promise<Item | null> {
    let item = null;

    if (isNaN(Number(idOrIdText))) {
      item = await this._getByIdText(idOrIdText, config);
    } else {
      const id = parseInt(idOrIdText);
      item = await this.get(id, config);
    }

    return item;
  }

  async getMany(config: FindManyOptions<Item>): Promise<Item[]> {
    return this.repositoryRead.find(config);
  }

  async getBy(channel: Channel, dto: ItemGetByDto): Promise<Item | null> {
    let item = null;

    if (dto.guid) {
      item = await this.getByGuid(channel, dto.guid);
    }
    
    if (!item && dto.guid_enclosure_url) {
      item = await this.getByEnclosureUrl(channel, dto.guid_enclosure_url);
    }

    return item;
  }

  async getByGuid(channel: Channel, guid: string): Promise<Item | null> {
    return this.repositoryRead.findOne({
      where: {
        channel,
        guid
      }
    });
  }

  async getByEnclosureUrl(channel: Channel, guid_enclosure_url: string): Promise<Item | null> {
    return this.repositoryRead.findOne({
      where: {
        channel,
        guid_enclosure_url
      }
    });
  }

  async getManyByChannel(channel: Channel, options?: FindManyOptions<Item>): Promise<Item[]> {
    return this.repositoryRead.find({
      where: {
        channel,
        live_item: {
          id: IsNull()
        }
      },
      ...options
    });
  }

  async getManyWithLiveItemByChannel(channel: Channel, options?: FindManyOptions<Item>): Promise<Item[]> {
    return this.repositoryRead.find({
      where: {
        channel,
        live_item: {
          id: Not(IsNull())
        }
      },
      ...options
    });
  }

  async update(channel: Channel, dto: ItemDto): Promise<Item> {
    let item = await this.getBy(channel, {
      guid_enclosure_url: dto.guid_enclosure_url,
      guid: dto.guid
    });

    if (!item) {
      item = new Item();
      item.guid = dto.guid;
      item.guid_enclosure_url = dto.guid_enclosure_url;
      item.channel = channel;
      item = await this.repositoryReadWrite.save(item);
    }

    item = applyProperties(item, dto);

    return this.repositoryReadWrite.save(item);
  }

  async delete(id: number): Promise<void> {
    await this.repositoryReadWrite.delete(id);
  }

  async deleteMany(ids: number[]): Promise<void> {
    if (ids.length) {
      await this.repositoryReadWrite.delete(ids);
    }
  }
}
