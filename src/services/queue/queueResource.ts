import { EntityManager, FindOptionsOrderValue, LessThan, MoreThan } from 'typeorm';
import { QueueResource } from '@orm/entities/queue/queueResource';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { QueueService } from '@orm/services/queue/queue';
import { ClipService } from '../clip';
import { ItemService } from '../item/item';
import { getMd5Hash } from 'podverse-helpers';
import { ItemChapterService } from '../item/itemChapter';
import { ItemSoundbiteService } from '../item/itemSoundbite';

const QUEUE_LIST_POSITION_INCREMENT = 0.00000001;

export class QueueResourceService extends BaseManyService<QueueResource, 'queue'> {
  private queueService: QueueService;
  private clipService: ClipService;
  private itemService: ItemService;
  private itemChapterService: ItemChapterService;
  private itemSoundbiteService: ItemSoundbiteService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(QueueResource, 'queue', transactionalEntityManager);
    this.queueService = new QueueService(transactionalEntityManager);
    this.clipService = new ClipService(transactionalEntityManager);
    this.itemService = new ItemService();
    this.itemChapterService = new ItemChapterService();
    this.itemSoundbiteService = new ItemSoundbiteService();
  }

  async getAllByQueueId(queue_id_text: string): Promise<QueueResource[]> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const options = {
      where: { queue: { id: queue.id } },
      order: { list_position: 'ASC' as FindOptionsOrderValue },
      relations: ['clip', 'item', 'item_chapter', 'item_soundbite']
    };

    return this.repositoryRead.find(options);
  }

  async getItemsByQueueIdTextAndPosition(queue_id_text: string, position: string): Promise<QueueResource[]> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    return this.repositoryRead.find({
      where: { queue, list_position: position }
    });
  }

  async getFirstAndLastQueuedItemsByQueueIdText(queue_id_text: string): Promise<{ firstQueued: QueueResource | null, lastQueued: QueueResource | null }> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const firstQueued = await this.repositoryRead.findOne({
      // TODO: how to handle numeric string type?
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { queue, list_position: MoreThan(0) as any },
      order: { list_position: 'ASC' }
    });

    const lastQueued = await this.repositoryRead.findOne({
      where: { queue },
      order: { list_position: 'DESC' }
    });

    return { firstQueued, lastQueued };
  }

  async getMostRecentHistoryItemByQueueIdText(queue_id_text: string): Promise<QueueResource | null> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const mostRecentHistoryItem = await this.repositoryRead.findOne({
      // TODO: how to handle numeric string type?
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { queue, list_position: LessThan(0) as any },
      order: { list_position: 'DESC' }
    });

    return mostRecentHistoryItem;
  }

  private async addClipToQueue(
    queue_id_text: string,
    clip_id_text: string,
    calculatePosition: (firstQueued: QueueResource | null, lastQueued: QueueResource | null) => string
  ): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const clip = await this.clipService.getByIdText(clip_id_text);
    if (!clip) {
      throw new Error("Clip not found.");
    }

    const { firstQueued, lastQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);

    const list_position = calculatePosition(firstQueued as QueueResource, lastQueued as QueueResource);

    const finalDto = {
      clip,
      list_position
    };

    return this._update(
      queue,
      ['queue', 'clip'],
      finalDto
    );
  }

  private async addClipToQueueHelper(
    queue_id_text: string,
    clip_id_text: string,
    calculatePosition: (firstQueued: QueueResource | null, lastQueued: QueueResource | null) => string
  ): Promise<QueueResource> {
    return this.addClipToQueue(queue_id_text, clip_id_text, calculatePosition);
  }

  async addClipToQueueNext(queue_id_text: string, clip_id_text: string): Promise<QueueResource> {
    const { firstQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = firstQueued ? parseFloat(firstQueued.list_position) - QUEUE_LIST_POSITION_INCREMENT : 1;
    return this.addClipToQueueHelper(queue_id_text, clip_id_text, () => newPosition.toString());
  }

  async addClipToQueueLast(queue_id_text: string, clip_id_text: string): Promise<QueueResource> {
    const { lastQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = lastQueued ? parseFloat(lastQueued.list_position) + QUEUE_LIST_POSITION_INCREMENT : '1';
    return this.addClipToQueueHelper(queue_id_text, clip_id_text, () => newPosition.toString());
  }

  async addClipToQueueBetween(queue_id_text: string, clip_id_text: string, position1: number, position2: number): Promise<QueueResource> {
    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addClipToQueueHelper(queue_id_text, clip_id_text, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async addClipToNowPlaying(queue_id_text: string, clip_id_text: string): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const clip = await this.clipService.getByIdText(clip_id_text);
    if (!clip) {
      throw new Error("Clip not found.");
    }

    const finalDto = {
      clip,
      list_position: '0'
    };

    return this._update(
      queue,
      ['queue', 'clip'],
      finalDto
    );
  }

  async addClipToHistory(queue_id_text: string, clip_id_text: string): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const clip = await this.clipService.getByIdText(clip_id_text);
    if (!clip) {
      throw new Error("Clip not found.");
    }

    const mostRecentHistoryItem = await this.getMostRecentHistoryItemByQueueIdText(queue_id_text);
    const newPosition = mostRecentHistoryItem ? parseFloat(mostRecentHistoryItem.list_position) + QUEUE_LIST_POSITION_INCREMENT : -1;

    const finalDto = {
      clip,
      list_position: newPosition.toString()
    };

    return this._update(
      queue,
      ['queue', 'clip'],
      finalDto
    );
  }

  async removeClipFromQueue(queue_id_text: string, clip_id_text: string): Promise<void> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const clip = await this.clipService.getByIdText(clip_id_text);
    if (!clip) {
      throw new Error("Clip not found.");
    }

    return this._delete(queue, { clip_id: clip.id });
  }

  private async addItemToQueue(
    queue_id_text: string,
    item_id_text: string,
    calculatePosition: (firstQueued: QueueResource | null, lastQueued: QueueResource | null) => string
  ): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const item = await this.itemService.getByIdText(item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    const { firstQueued, lastQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);

    const list_position = calculatePosition(firstQueued as QueueResource, lastQueued as QueueResource);

    const finalDto = {
      item,
      list_position
    };

    return this._update(
      queue,
      ['queue', 'item'],
      finalDto
    );
  }

  private async addItemToQueueHelper(
    queue_id_text: string,
    item_id_text: string,
    calculatePosition: (firstQueued: QueueResource | null, lastQueued: QueueResource | null) => string
  ): Promise<QueueResource> {
    return this.addItemToQueue(queue_id_text, item_id_text, calculatePosition);
  }

  async addItemToQueueNext(queue_id_text: string, item_id_text: string): Promise<QueueResource> {
    const { firstQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = firstQueued ? parseFloat(firstQueued.list_position) - QUEUE_LIST_POSITION_INCREMENT : 1;
    return this.addItemToQueueHelper(queue_id_text, item_id_text, () => newPosition.toString());
  }

  async addItemToQueueLast(queue_id_text: string, item_id_text: string): Promise<QueueResource> {
    const { lastQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = lastQueued ? parseFloat(lastQueued.list_position) + QUEUE_LIST_POSITION_INCREMENT : '1';
    return this.addItemToQueueHelper(queue_id_text, item_id_text, () => newPosition.toString());
  }

  async addItemToQueueBetween(queue_id_text: string, item_id_text: string, position1: number, position2: number): Promise<QueueResource> {
    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemToQueueHelper(queue_id_text, item_id_text, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async addItemToNowPlaying(queue_id_text: string, item_id_text: string): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const item = await this.itemService.getByIdText(item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    const finalDto = {
      item,
      list_position: '0'
    };

    return this._update(
      queue,
      ['queue', 'item'],
      finalDto
    );
  }

  async addItemToHistory(queue_id_text: string, item_id_text: string): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const item = await this.itemService.getByIdText(item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    const mostRecentHistoryItem = await this.getMostRecentHistoryItemByQueueIdText(queue_id_text);
    const newPosition = mostRecentHistoryItem ? parseFloat(mostRecentHistoryItem.list_position) + QUEUE_LIST_POSITION_INCREMENT : -1;

    const finalDto = {
      item,
      list_position: newPosition.toString()
    };

    return this._update(
      queue,
      ['queue', 'item'],
      finalDto
    );
  }

  async removeItemFromQueue(queue_id_text: string, item_id_text: string): Promise<void> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const item = await this.itemService.getByIdText(item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    return this._delete(queue, { item_id: item.id });
  }
  
  private async addItemAddByRSSToQueue(
    queue_id_text: string,
    add_by_rss_resource_data: object,
    calculatePosition: (firstQueued: QueueResource | null, lastQueued: QueueResource | null) => string
  ): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const { firstQueued, lastQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);

    const list_position = calculatePosition(firstQueued as QueueResource, lastQueued as QueueResource);
    const add_by_rss_hash_id = getMd5Hash(add_by_rss_resource_data);

    const finalDto = {
      add_by_rss_resource_data,
      list_position,
      add_by_rss_hash_id
    };

    return this._update(
      queue,
      ['queue', 'add_by_rss_hash_id'],
      finalDto
    );
  }

  private async addItemAddByRSSToQueueHelper(
    queue_id_text: string,
    add_by_rss_resource_data: object,
    calculatePosition: (firstQueued: QueueResource | null, lastQueued: QueueResource | null) => string
  ): Promise<QueueResource> {
    return this.addItemAddByRSSToQueue(queue_id_text, add_by_rss_resource_data, calculatePosition);
  }

  async addItemAddByRSSToQueueNext(queue_id_text: string, add_by_rss_resource_data: object): Promise<QueueResource> {
    return this.addItemAddByRSSToQueueHelper(queue_id_text, add_by_rss_resource_data, (firstQueued) => {
      const newPosition = firstQueued ? parseFloat(firstQueued.list_position) - QUEUE_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addItemAddByRSSToQueueLast(queue_id_text: string, add_by_rss_resource_data: object): Promise<QueueResource> {
    return this.addItemAddByRSSToQueueHelper(queue_id_text, add_by_rss_resource_data, (_, lastQueued) => {
      return lastQueued ? (parseFloat(lastQueued.list_position) + QUEUE_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addItemAddByRSSToQueueBetween(queue_id_text: string, add_by_rss_resource_data: object, position1: number, position2: number): Promise<QueueResource> {
    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemAddByRSSToQueueHelper(queue_id_text, add_by_rss_resource_data, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async addItemAddByRSSToNowPlaying(queue_id_text: string, add_by_rss_resource_data: object): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const add_by_rss_hash_id = getMd5Hash(add_by_rss_resource_data);
  
    const finalDto = {
      add_by_rss_resource_data,
      list_position: '0',
      add_by_rss_hash_id
    };
  
    return this._update(
      queue,
      ['queue', 'add_by_rss_hash_id'],
      finalDto
    );
  }
  
  async addItemAddByRSSToHistory(queue_id_text: string, add_by_rss_resource_data: object): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }
  
    const add_by_rss_hash_id = getMd5Hash(add_by_rss_resource_data);
  
    const mostRecentHistoryItem = await this.getMostRecentHistoryItemByQueueIdText(queue_id_text);
    const newPosition = mostRecentHistoryItem ? parseFloat(mostRecentHistoryItem.list_position) + QUEUE_LIST_POSITION_INCREMENT : -1;
  
    const finalDto = {
      add_by_rss_resource_data,
      list_position: newPosition.toString(),
      add_by_rss_hash_id
    };
  
    return this._update(
      queue,
      ['queue', 'add_by_rss_hash_id'],
      finalDto
    );
  }

  async removeItemAddByRSSFromQueue(queue_id_text: string, add_by_rss_hash_id: string): Promise<void> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    return this._delete(queue, { add_by_rss_hash_id });
  }

  private async addItemChapterToQueue(
    queue_id_text: string,
    item_chapter_id_text: string,
    calculatePosition: (firstQueued: QueueResource | null, lastQueued: QueueResource | null) => string
  ): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const itemChapter = await this.itemChapterService.getByIdText(item_chapter_id_text);
    if (!itemChapter) {
      throw new Error("Item chapter not found.");
    }

    const { firstQueued, lastQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);

    const list_position = calculatePosition(firstQueued as QueueResource, lastQueued as QueueResource);

    const finalDto = {
      item_chapter: itemChapter,
      list_position
    };

    return this._update(
      queue,
      ['queue', 'item_chapter'],
      finalDto
    );
  }

  private async addItemChapterToQueueHelper(
    queue_id_text: string,
    item_chapter_id_text: string,
    calculatePosition: (firstQueued: QueueResource | null, lastQueued: QueueResource | null) => string
  ): Promise<QueueResource> {
    return this.addItemChapterToQueue(queue_id_text, item_chapter_id_text, calculatePosition);
  }

  async addItemChapterToQueueNext(queue_id_text: string, item_chapter_id_text: string): Promise<QueueResource> {
    const { firstQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = firstQueued ? parseFloat(firstQueued.list_position) - QUEUE_LIST_POSITION_INCREMENT : 1;
    return this.addItemChapterToQueueHelper(queue_id_text, item_chapter_id_text, () => newPosition.toString());
  }

  async addItemChapterToQueueLast(queue_id_text: string, item_chapter_id_text: string): Promise<QueueResource> {
    const { lastQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = lastQueued ? parseFloat(lastQueued.list_position) + QUEUE_LIST_POSITION_INCREMENT : '1';
    return this.addItemChapterToQueueHelper(queue_id_text, item_chapter_id_text, () => newPosition.toString());
  }

  async addItemChapterToQueueBetween(queue_id_text: string, item_chapter_id_text: string, position1: number, position2: number): Promise<QueueResource> {
    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemChapterToQueueHelper(queue_id_text, item_chapter_id_text, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async addItemChapterToNowPlaying(queue_id_text: string, item_chapter_id_text: string): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const itemChapter = await this.itemChapterService.getByIdText(item_chapter_id_text);
    if (!itemChapter) {
      throw new Error("Item chapter not found.");
    }

    const finalDto = {
      item_chapter: itemChapter,
      list_position: '0'
    };

    return this._update(
      queue,
      ['queue', 'item_chapter'],
      finalDto
    );
  }

  async addItemChapterToHistory(queue_id_text: string, item_chapter_id_text: string): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const itemChapter = await this.itemChapterService.getByIdText(item_chapter_id_text);
    if (!itemChapter) {
      throw new Error("Item chapter not found.");
    }

    const mostRecentHistoryItem = await this.getMostRecentHistoryItemByQueueIdText(queue_id_text);
    const newPosition = mostRecentHistoryItem ? parseFloat(mostRecentHistoryItem.list_position) + QUEUE_LIST_POSITION_INCREMENT : -1;

    const finalDto = {
      item_chapter: itemChapter,
      list_position: newPosition.toString()
    };

    return this._update(
      queue,
      ['queue', 'item_chapter'],
      finalDto
    );
  }

  async removeItemChapterFromQueue(queue_id_text: string, item_chapter_id_text: string): Promise<void> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const itemChapter = await this.itemChapterService.getByIdText(item_chapter_id_text);
    if (!itemChapter) {
      throw new Error("Item chapter not found.");
    }

    return this._delete(queue, { item_chapter_id: itemChapter.id });
  }

  private async addItemSoundbiteToQueue(
    queue_id_text: string,
    item_soundbite_id_text: string,
    calculatePosition: (firstQueued: QueueResource | null, lastQueued: QueueResource | null) => string
  ): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const item_soundbite = await this.itemSoundbiteService.getByIdText(item_soundbite_id_text);
    if (!item_soundbite) {
      throw new Error("Soundbite not found.");
    }

    const { firstQueued, lastQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);

    const list_position = calculatePosition(firstQueued as QueueResource, lastQueued as QueueResource);

    const finalDto = {
      item_soundbite,
      list_position
    };

    return this._update(
      queue,
      ['queue', 'item_soundbite'],
      finalDto
    );
  }

  private async addItemSoundbiteToQueueHelper(
    queue_id_text: string,
    item_soundbite_id_text: string,
    calculatePosition: (firstQueued: QueueResource | null, lastQueued: QueueResource | null) => string
  ): Promise<QueueResource> {
    return this.addItemSoundbiteToQueue(queue_id_text, item_soundbite_id_text, calculatePosition);
  }

  async addItemSoundbiteToQueueNext(queue_id_text: string, item_soundbite_id_text: string): Promise<QueueResource> {
    const { firstQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = firstQueued ? parseFloat(firstQueued.list_position) - QUEUE_LIST_POSITION_INCREMENT : 1;
    return this.addItemSoundbiteToQueueHelper(queue_id_text, item_soundbite_id_text, () => newPosition.toString());
  }

  async addItemSoundbiteToQueueLast(queue_id_text: string, item_soundbite_id_text: string): Promise<QueueResource> {
    const { lastQueued } = await this.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = lastQueued ? parseFloat(lastQueued.list_position) + QUEUE_LIST_POSITION_INCREMENT : '1';
    return this.addItemSoundbiteToQueueHelper(queue_id_text, item_soundbite_id_text, () => newPosition.toString());
  }

  async addItemSoundbiteToQueueBetween(queue_id_text: string, item_soundbite_id_text: string, position1: number, position2: number): Promise<QueueResource> {
    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemSoundbiteToQueueHelper(queue_id_text, item_soundbite_id_text, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async addItemSoundbiteToNowPlaying(queue_id_text: string, item_soundbite_id_text: string): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const item_soundbite = await this.itemSoundbiteService.getByIdText(item_soundbite_id_text);
    if (!item_soundbite) {
      throw new Error("Soundbite not found.");
    }

    const finalDto = {
      item_soundbite,
      list_position: '0'
    };

    return this._update(
      queue,
      ['queue', 'item_soundbite'],
      finalDto
    );
  }

  async addItemSoundbiteToHistory(queue_id_text: string, item_soundbite_id_text: string): Promise<QueueResource> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const item_soundbite = await this.itemSoundbiteService.getByIdText(item_soundbite_id_text);
    if (!item_soundbite) {
      throw new Error("Soundbite not found.");
    }

    const mostRecentHistoryItem = await this.getMostRecentHistoryItemByQueueIdText(queue_id_text);
    const newPosition = mostRecentHistoryItem ? parseFloat(mostRecentHistoryItem.list_position) + QUEUE_LIST_POSITION_INCREMENT : -1;

    const finalDto = {
      item_soundbite,
      list_position: newPosition.toString()
    };

    return this._update(
      queue,
      ['queue', 'item_soundbite'],
      finalDto
    );
  }

  async removeItemSoundbiteFromQueue(queue_id_text: string, item_soundbite_id_text: string): Promise<void> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const item_soundbite = await this.itemSoundbiteService.getByIdText(item_soundbite_id_text);
    if (!item_soundbite) {
      throw new Error("Soundbite not found.");
    }

    return this._delete(queue, { item_soundbite_id: item_soundbite.id });
  }
}
