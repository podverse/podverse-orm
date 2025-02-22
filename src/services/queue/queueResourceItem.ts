import { EntityManager } from 'typeorm';
import { QueueResourceItem } from '@orm/entities/queue/queueResourceItem';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { ItemService } from '@orm/services/item/item';
import { QueueService, QUEUE_LIST_POSITION_INCREMENT } from '@orm/services/queue/queue';
import { QueueResourceBaseService } from '@orm/services/queue/queueResourceBase';

export class QueueResourceItemService extends BaseManyService<QueueResourceItem, 'queue'> {
  private queueService: QueueService;
  private itemService: ItemService;
  private queueResourceBaseService: QueueResourceBaseService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(QueueResourceItem, 'queue', transactionalEntityManager);
    this.queueService = new QueueService(transactionalEntityManager);
    this.itemService = new ItemService();
    this.queueResourceBaseService = new QueueResourceBaseService(transactionalEntityManager);
  }

  private async addItemToQueue(
    queue_id_text: string,
    item_id_text: string,
    calculatePosition: (firstQueuedItem: QueueResourceItem | null, lastQueuedItem: QueueResourceItem | null) => string
  ): Promise<QueueResourceItem> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const item = await this.itemService.getByIdText(item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    const { firstQueuedItem, lastQueuedItem } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);

    const list_position = calculatePosition(firstQueuedItem as QueueResourceItem, lastQueuedItem as QueueResourceItem);

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
    calculatePosition: (firstQueuedItem: QueueResourceItem | null, lastQueuedItem: QueueResourceItem | null) => string
  ): Promise<QueueResourceItem> {
    return this.addItemToQueue(queue_id_text, item_id_text, calculatePosition);
  }

  async addItemToHistory(queue_id_text: string, item_id_text: string): Promise<QueueResourceItem> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const item = await this.itemService.getByIdText(item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    const mostRecentHistoryItem = await this.queueResourceBaseService.getMostRecentHistoryItemByQueueIdText(queue_id_text);
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

  async addItemToNowPlaying(queue_id_text: string, item_id_text: string): Promise<QueueResourceItem> {
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

  async addItemToQueueNext(queue_id_text: string, item_id_text: string): Promise<QueueResourceItem> {
    const { firstQueuedItem } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = firstQueuedItem ? parseFloat(firstQueuedItem.list_position) - QUEUE_LIST_POSITION_INCREMENT : 1;
    return this.addItemToQueueHelper(queue_id_text, item_id_text, () => newPosition.toString());
  }

  async addItemToQueueLast(queue_id_text: string, item_id_text: string): Promise<QueueResourceItem> {
    const { lastQueuedItem } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = lastQueuedItem ? parseFloat(lastQueuedItem.list_position) + QUEUE_LIST_POSITION_INCREMENT : '1';
    return this.addItemToQueueHelper(queue_id_text, item_id_text, () => newPosition.toString());
  }

  async addItemToQueueBetween(queue_id_text: string, item_id_text: string, position1: number, position2: number): Promise<QueueResourceItem> {
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
}
