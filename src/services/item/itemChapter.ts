import { FindManyOptions, FindOneOptions, EntityManager, In } from 'typeorm';
import { ItemChapter } from '@orm/entities/item/itemChapter';
import { ItemChaptersFeed } from '@orm/entities/item/itemChaptersFeed';
import { BaseManyService } from '@orm/services/base/baseManyService';

export type ItemChapterDto = {
  start_time: string
  end_time: string | null
  title: string | null
  web_url: string | null
  table_of_contents: boolean
  data_hash: string
}

export class ItemChapterService extends BaseManyService<ItemChapter, 'item_chapters_feed'> {
  constructor(transactionalEntityManager?: EntityManager) {
    super(ItemChapter, 'item_chapters_feed', transactionalEntityManager);
  }

  async getAll(item_chapters_feed: ItemChaptersFeed, config?: FindManyOptions<ItemChapter>): Promise<ItemChapter[]> {
    const feed = { ...item_chapters_feed };
    delete (feed as Partial<ItemChaptersFeed>).item_chapters;
    delete (feed as Partial<ItemChaptersFeed>).item_chapters_feed_log;
    return super._getAll(feed, config);
  }

  async getAllWithCount(item_chapters_feed: ItemChaptersFeed, config?: FindManyOptions<ItemChapter>): Promise<{ count: number; results: ItemChapter[] }> {
    if (!item_chapters_feed) {
      return { count: 0, results: [] };
    }
    const feed = { ...item_chapters_feed };
    delete (feed as Partial<ItemChaptersFeed>).item_chapters;
    delete (feed as Partial<ItemChaptersFeed>).item_chapters_feed_log;
    return super._getAllWithCount(feed, config);
  }

  async getByIdText(id_text: string, config?: FindOneOptions<ItemChapter>): Promise<ItemChapter | null> {
    const options: FindOneOptions<ItemChapter> = {
      where: { id_text },
      ...config
    };

    return this.repositoryRead.findOne(options);
  }

  async update(item_chapters_feed: ItemChaptersFeed, dto: ItemChapterDto): Promise<ItemChapter> {    
    const whereKeys = ['start_time', 'end_time', 'table_of_contents'] as (keyof ItemChapter)[];
    return super._update(item_chapters_feed, whereKeys, dto);
  }

  async updateMany(item_chapters_feed: ItemChaptersFeed, dtos: ItemChapterDto[]): Promise<ItemChapter[]> {
    const whereKeys = ['start_time', 'end_time', 'table_of_contents'] as (keyof ItemChapter)[];
    return super._updateMany(item_chapters_feed, whereKeys, dtos);
  }


  async deleteMany(ids: number[]): Promise<void> {
    if (ids.length) {
      await this.repositoryReadWrite.delete(ids);
    }
  }

  async deleteManyByDataHash(item_chapters_feed: ItemChaptersFeed, dataHashes: string[]): Promise<void> {
    if (!dataHashes.length) return;
    await this.repositoryReadWrite.delete({
      item_chapters_feed,
      data_hash: In(dataHashes)
    });
  }

}
