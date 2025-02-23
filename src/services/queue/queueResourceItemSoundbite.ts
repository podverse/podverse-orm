import { EntityManager } from 'typeorm';
import { QueueResourceItemSoundbite } from '@orm/entities/queue/queueResourceItemSoundbite';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { ItemSoundbiteService } from '@orm/services/item/itemSoundbite';
import { QueueService, QUEUE_LIST_POSITION_INCREMENT } from '@orm/services/queue/queue';
import { QueueResourceBaseService } from '@orm/services/queue/queueResourceBase';
import { QueueResourceBase } from '@orm/entities/queue/queueResourceBase';

export class QueueResourceItemSoundbiteService extends BaseManyService<QueueResourceItemSoundbite, 'queue'> {
  private queueService: QueueService;
  private itemSoundbiteService: ItemSoundbiteService;
  private queueResourceBaseService: QueueResourceBaseService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(QueueResourceItemSoundbite, 'queue', transactionalEntityManager);
    this.queueService = new QueueService(transactionalEntityManager);
    this.itemSoundbiteService = new ItemSoundbiteService(transactionalEntityManager);
    this.queueResourceBaseService = new QueueResourceBaseService(transactionalEntityManager);
  }

  private async addItemSoundbiteToQueue(
    queue_id_text: string,
    soundbite_id_text: string,
    calculatePosition: (firstQueued: QueueResourceBase | null, lastQueued: QueueResourceBase | null) => string
  ): Promise<QueueResourceItemSoundbite> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const soundbite = await this.itemSoundbiteService.getByIdText(soundbite_id_text);
    if (!soundbite) {
      throw new Error("Soundbite not found.");
    }

    const { firstQueued, lastQueued } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);

    const list_position = calculatePosition(firstQueued as QueueResourceBase, lastQueued as QueueResourceBase);

    const finalDto = {
      soundbite,
      list_position
    };

    return this._update(
      queue,
      ['queue', 'soundbite'],
      finalDto
    );
  }

  private async addItemSoundbiteToQueueHelper(
    queue_id_text: string,
    soundbite_id_text: string,
    calculatePosition: (firstQueued: QueueResourceBase | null, lastQueued: QueueResourceBase | null) => string
  ): Promise<QueueResourceItemSoundbite> {
    return this.addItemSoundbiteToQueue(queue_id_text, soundbite_id_text, calculatePosition);
  }

  async addItemSoundbiteToQueueNext(queue_id_text: string, soundbite_id_text: string): Promise<QueueResourceItemSoundbite> {
    const { firstQueued } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = firstQueued ? parseFloat(firstQueued.list_position) - QUEUE_LIST_POSITION_INCREMENT : 1;
    return this.addItemSoundbiteToQueueHelper(queue_id_text, soundbite_id_text, () => newPosition.toString());
  }

  async addItemSoundbiteToQueueLast(queue_id_text: string, soundbite_id_text: string): Promise<QueueResourceItemSoundbite> {
    const { lastQueued } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = lastQueued ? parseFloat(lastQueued.list_position) + QUEUE_LIST_POSITION_INCREMENT : '1';
    return this.addItemSoundbiteToQueueHelper(queue_id_text, soundbite_id_text, () => newPosition.toString());
  }

  async addItemSoundbiteToQueueBetween(queue_id_text: string, soundbite_id_text: string, position1: number, position2: number): Promise<QueueResourceItemSoundbite> {
    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemSoundbiteToQueueHelper(queue_id_text, soundbite_id_text, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async addItemSoundbiteToNowPlaying(queue_id_text: string, soundbite_id_text: string): Promise<QueueResourceItemSoundbite> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const soundbite = await this.itemSoundbiteService.getByIdText(soundbite_id_text);
    if (!soundbite) {
      throw new Error("Soundbite not found.");
    }

    const finalDto = {
      soundbite,
      list_position: '0'
    };

    return this._update(
      queue,
      ['queue', 'soundbite'],
      finalDto
    );
  }

  async addItemSoundbiteToHistory(queue_id_text: string, soundbite_id_text: string): Promise<QueueResourceItemSoundbite> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const soundbite = await this.itemSoundbiteService.getByIdText(soundbite_id_text);
    if (!soundbite) {
      throw new Error("Soundbite not found.");
    }

    const mostRecentHistoryItem = await this.queueResourceBaseService.getMostRecentHistoryItemByQueueIdText(queue_id_text);
    const newPosition = mostRecentHistoryItem ? parseFloat(mostRecentHistoryItem.list_position) + QUEUE_LIST_POSITION_INCREMENT : -1;

    const finalDto = {
      soundbite,
      list_position: newPosition.toString()
    };

    return this._update(
      queue,
      ['queue', 'soundbite'],
      finalDto
    );
  }

  async removeItemSoundbiteFromQueue(queue_id_text: string, soundbite_id_text: string): Promise<void> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const soundbite = await this.itemSoundbiteService.getByIdText(soundbite_id_text);
    if (!soundbite) {
      throw new Error("Soundbite not found.");
    }

    return this._delete(queue, { soundbite_id: soundbite.id });
  }
}