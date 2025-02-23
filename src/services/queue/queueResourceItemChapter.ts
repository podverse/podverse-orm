import { EntityManager } from 'typeorm';
import { QueueResourceItemChapter } from '@orm/entities/queue/queueResourceItemChapter';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { ItemChapterService } from '@orm/services/item/itemChapter';
import { QueueService, QUEUE_LIST_POSITION_INCREMENT } from '@orm/services/queue/queue';
import { QueueResourceBaseService } from '@orm/services/queue/queueResourceBase';
import { QueueResourceBase } from '@orm/entities/queue/queueResourceBase';

export class QueueResourceItemChapterService extends BaseManyService<QueueResourceItemChapter, 'queue'> {
  private queueService: QueueService;
  private itemChapterService: ItemChapterService;
  private queueResourceBaseService: QueueResourceBaseService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(QueueResourceItemChapter, 'queue', transactionalEntityManager);
    this.queueService = new QueueService(transactionalEntityManager);
    this.itemChapterService = new ItemChapterService(transactionalEntityManager);
    this.queueResourceBaseService = new QueueResourceBaseService(transactionalEntityManager);
  }

  private async addItemChapterToQueue(
    queue_id_text: string,
    item_chapter_id_text: string,
    calculatePosition: (firstQueued: QueueResourceBase | null, lastQueued: QueueResourceBase | null) => string
  ): Promise<QueueResourceItemChapter> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const itemChapter = await this.itemChapterService.getByIdText(item_chapter_id_text);
    if (!itemChapter) {
      throw new Error("Item chapter not found.");
    }

    const { firstQueued, lastQueued } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);

    const list_position = calculatePosition(firstQueued as QueueResourceBase, lastQueued as QueueResourceBase);

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
    calculatePosition: (firstQueued: QueueResourceBase | null, lastQueued: QueueResourceBase | null) => string
  ): Promise<QueueResourceItemChapter> {
    return this.addItemChapterToQueue(queue_id_text, item_chapter_id_text, calculatePosition);
  }

  async addItemChapterToQueueNext(queue_id_text: string, item_chapter_id_text: string): Promise<QueueResourceItemChapter> {
    const { firstQueued } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = firstQueued ? parseFloat(firstQueued.list_position) - QUEUE_LIST_POSITION_INCREMENT : 1;
    return this.addItemChapterToQueueHelper(queue_id_text, item_chapter_id_text, () => newPosition.toString());
  }

  async addItemChapterToQueueLast(queue_id_text: string, item_chapter_id_text: string): Promise<QueueResourceItemChapter> {
    const { lastQueued } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = lastQueued ? parseFloat(lastQueued.list_position) + QUEUE_LIST_POSITION_INCREMENT : '1';
    return this.addItemChapterToQueueHelper(queue_id_text, item_chapter_id_text, () => newPosition.toString());
  }

  async addItemChapterToQueueBetween(queue_id_text: string, item_chapter_id_text: string, position1: number, position2: number): Promise<QueueResourceItemChapter> {
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

  async addItemChapterToNowPlaying(queue_id_text: string, item_chapter_id_text: string): Promise<QueueResourceItemChapter> {
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

  async addItemChapterToHistory(queue_id_text: string, item_chapter_id_text: string): Promise<QueueResourceItemChapter> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const itemChapter = await this.itemChapterService.getByIdText(item_chapter_id_text);
    if (!itemChapter) {
      throw new Error("Item chapter not found.");
    }

    const mostRecentHistoryItem = await this.queueResourceBaseService.getMostRecentHistoryItemByQueueIdText(queue_id_text);
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
}