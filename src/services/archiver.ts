import { AppDataSourceRead, AppDataSourceReadWrite } from '@orm/db';
import { Clip } from '@orm/entities/clip';
import { Feed } from '@orm/entities/feed/feed';
import { FeedFlagStatusStatusEnum } from '@orm/entities/feed/feedFlagStatus';
import { Item } from '@orm/entities/item/item';
import { ItemFlagStatus, ItemFlagStatusStatusEnum } from '@orm/entities/item/itemFlagStatus';
import { PlaylistResource } from '@orm/entities/playlist/playlistResource';
import { ItemFlagStatusService } from './item/itemFlagStatus';

export class ArchiverService {
  private itemRepositoryRead = AppDataSourceRead.getRepository(Item);
  private itemRepositoryReadWrite = AppDataSourceReadWrite.getRepository(Item);
  private feedRepositoryRead = AppDataSourceRead.getRepository(Feed);
  private feedRepositoryReadWrite = AppDataSourceReadWrite.getRepository(Feed);
  private playlistResourceRepository = AppDataSourceRead.getRepository(PlaylistResource);
  private clipRepository = AppDataSourceRead.getRepository(Clip);

  async getItemsPendingArchive(): Promise<Item[]> {
    return this.itemRepositoryRead.find({
      where: [
        {
          item_flag_status: {
            id: ItemFlagStatusStatusEnum.PendingArchive,
          },
        },
        {
          channel: {
            feed: {
              feed_flag_status: {
                id: FeedFlagStatusStatusEnum.PendingArchive,
              },
            },
          },
        },
      ],
      relations: ['channel', 'channel.feed', 'item_flag_status', 'channel.feed.feed_flag_status'],
    });
  }

  async getFeedsPendingArchive(): Promise<Feed[]> {
    return this.feedRepositoryRead.find({
      where: {
        feed_flag_status: {
          id: FeedFlagStatusStatusEnum.PendingArchive,
        },
      },
      relations: ['channel', 'channel.items', 'feed_flag_status'],
    });
  }

  private async processItems(items: Item[], archivedStatus: ItemFlagStatus): Promise<void> {
    for (const item of items) {
      const hasPlaylistResource = await this.playlistResourceRepository.findOne({
        where: { item: { id: item.id } },
      });

      const hasClip = await this.clipRepository.findOne({
        where: { item: { id: item.id } },
      });

      if (hasPlaylistResource || hasClip) {
        item.item_flag_status = archivedStatus;
        await this.itemRepositoryReadWrite.save(item);
      } else {
        await this.itemRepositoryReadWrite.delete(item.id);
      }
    }
  }

  async processPendingArchiveFeeds(): Promise<void> {
    const feeds = await this.getFeedsPendingArchive();
    const itemFlagStatusService = new ItemFlagStatusService();
    const archivedStatus = await itemFlagStatusService.get(ItemFlagStatusStatusEnum.Archived);

    if (!archivedStatus) {
      throw new Error('Archived item_flag_status not found');
    }

    for (const feed of feeds) {
      const channel = feed.channel;

      if (!channel) {
        continue;
      }

      const items = await this.itemRepositoryRead.find({
        where: {
          channel: feed.channel
        },
        relations: ['item_flag_status']
      });

      if (items.length === 0) {
        await this.feedRepositoryReadWrite.delete(feed.id);
      } else {
        const activeOrPendingItems = items.filter(item =>
          [ItemFlagStatusStatusEnum.Active, ItemFlagStatusStatusEnum.PendingArchive].includes(item.item_flag_status.id)
        );
        await this.processItems(activeOrPendingItems, archivedStatus);
      }
    }
  }

  async processPendingArchiveItems(): Promise<void> {
    const items = await this.getItemsPendingArchive();
    const itemFlagStatusService = new ItemFlagStatusService();
    const archivedStatus = await itemFlagStatusService.get(ItemFlagStatusStatusEnum.Archived);

    if (!archivedStatus) {
      throw new Error('Archived item_flag_status not found');
    }

    await this.processItems(items, archivedStatus);
  }

  async archiveAll(): Promise<void> {
    await this.processPendingArchiveFeeds();
    await this.processPendingArchiveItems();
  }
}
