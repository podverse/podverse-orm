import { EntityManager } from 'typeorm';
import { QueueResourceItemAddByRss } from '@orm/entities/queue/queueResourceItemAddByRSS';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { QueueService, QUEUE_LIST_POSITION_INCREMENT } from '@orm/services/queue/queue';
import { QueueResourceBaseService } from '@orm/services/queue/queueResourceBase';
import { getMd5Hash } from 'podverse-helpers';

export class QueueResourceItemAddByRSSService extends BaseManyService<QueueResourceItemAddByRss, 'queue'> {
  private queueService: QueueService;
  private queueResourceBaseService: QueueResourceBaseService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(QueueResourceItemAddByRss, 'queue', transactionalEntityManager);
    this.queueService = new QueueService(transactionalEntityManager);
    this.queueResourceBaseService = new QueueResourceBaseService(transactionalEntityManager);
  }

  private async addItemToQueue(
    queue_id_text: string,
    resource_data: object,
    calculatePosition: (firstQueued: QueueResourceItemAddByRss | null, lastQueued: QueueResourceItemAddByRss | null) => string
  ): Promise<QueueResourceItemAddByRss> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const { firstQueued, lastQueued } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);

    const list_position = calculatePosition(firstQueued as QueueResourceItemAddByRss, lastQueued as QueueResourceItemAddByRss);
    const hash_id = getMd5Hash(resource_data);

    const finalDto = {
      resource_data,
      list_position,
      hash_id
    };

    return this._update(
      queue,
      ['queue', 'hash_id'],
      finalDto
    );
  }

  private async addItemToQueueHelper(
    queue_id_text: string,
    resource_data: object,
    calculatePosition: (firstQueued: QueueResourceItemAddByRss | null, lastQueued: QueueResourceItemAddByRss | null) => string
  ): Promise<QueueResourceItemAddByRss> {
    return this.addItemToQueue(queue_id_text, resource_data, calculatePosition);
  }

  async addItemToQueueNext(queue_id_text: string, resource_data: object): Promise<QueueResourceItemAddByRss> {
    return this.addItemToQueueHelper(queue_id_text, resource_data, (firstQueued) => {
      const newPosition = firstQueued ? parseFloat(firstQueued.list_position) - QUEUE_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addItemToQueueLast(queue_id_text: string, resource_data: object): Promise<QueueResourceItemAddByRss> {
    return this.addItemToQueueHelper(queue_id_text, resource_data, (_, lastQueued) => {
      return lastQueued ? (parseFloat(lastQueued.list_position) + QUEUE_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addItemToQueueBetween(queue_id_text: string, resource_data: object, position1: number, position2: number): Promise<QueueResourceItemAddByRss> {
    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemToQueueHelper(queue_id_text, resource_data, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async addItemToNowPlaying(queue_id_text: string, resource_data: object): Promise<QueueResourceItemAddByRss> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }
  
    const hash_id = getMd5Hash(resource_data);
  
    const finalDto = {
      resource_data,
      list_position: '0',
      hash_id
    };
  
    return this._update(
      queue,
      ['queue', 'hash_id'],
      finalDto
    );
  }
  
  async addItemToHistory(queue_id_text: string, resource_data: object): Promise<QueueResourceItemAddByRss> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }
  
    const hash_id = getMd5Hash(resource_data);
  
    const mostRecentHistoryItem = await this.queueResourceBaseService.getMostRecentHistoryItemByQueueIdText(queue_id_text);
    const newPosition = mostRecentHistoryItem ? parseFloat(mostRecentHistoryItem.list_position) + QUEUE_LIST_POSITION_INCREMENT : -1;
  
    const finalDto = {
      resource_data,
      list_position: newPosition.toString(),
      hash_id
    };
  
    return this._update(
      queue,
      ['queue', 'hash_id'],
      finalDto
    );
  }

  async removeItemFromQueue(queue_id_text: string, hash_id: string): Promise<void> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    return this._delete(queue, { hash_id });
  }
}