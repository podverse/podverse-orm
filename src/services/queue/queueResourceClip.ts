import { EntityManager } from 'typeorm';
import { QueueResourceClip } from '@orm/entities/queue/queueResourceClip';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { ClipService } from '@orm/services/clip';
import { QueueService, QUEUE_LIST_POSITION_INCREMENT } from '@orm/services/queue/queue';
import { QueueResourceBaseService } from '@orm/services/queue/queueResourceBase';
import { QueueResourceBase } from '@orm/entities/queue/queueResourceBase';

export class QueueResourceClipService extends BaseManyService<QueueResourceClip, 'queue'> {
  private queueService: QueueService;
  private clipService: ClipService;
  private queueResourceBaseService: QueueResourceBaseService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(QueueResourceClip, 'queue', transactionalEntityManager);
    this.queueService = new QueueService(transactionalEntityManager);
    this.clipService = new ClipService(transactionalEntityManager);
    this.queueResourceBaseService = new QueueResourceBaseService(transactionalEntityManager);
  }

  private async addClipToQueue(
    queue_id_text: string,
    clip_id_text: string,
    calculatePosition: (firstQueued: QueueResourceBase | null, lastQueued: QueueResourceBase | null) => string
  ): Promise<QueueResourceClip> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const clip = await this.clipService.getByIdText(clip_id_text);
    if (!clip) {
      throw new Error("Clip not found.");
    }

    const { firstQueued, lastQueued } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);

    const list_position = calculatePosition(firstQueued as QueueResourceBase, lastQueued as QueueResourceBase);

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
    calculatePosition: (firstQueued: QueueResourceBase | null, lastQueued: QueueResourceBase | null) => string
  ): Promise<QueueResourceClip> {
    return this.addClipToQueue(queue_id_text, clip_id_text, calculatePosition);
  }

  async addClipToQueueNext(queue_id_text: string, clip_id_text: string): Promise<QueueResourceClip> {
    const { firstQueued } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = firstQueued ? parseFloat(firstQueued.list_position) - QUEUE_LIST_POSITION_INCREMENT : 1;
    return this.addClipToQueueHelper(queue_id_text, clip_id_text, () => newPosition.toString());
  }

  async addClipToQueueLast(queue_id_text: string, clip_id_text: string): Promise<QueueResourceClip> {
    const { lastQueued } = await this.queueResourceBaseService.getFirstAndLastQueuedItemsByQueueIdText(queue_id_text);
    const newPosition = lastQueued ? parseFloat(lastQueued.list_position) + QUEUE_LIST_POSITION_INCREMENT : '1';
    return this.addClipToQueueHelper(queue_id_text, clip_id_text, () => newPosition.toString());
  }

  async addClipToQueueBetween(queue_id_text: string, clip_id_text: string, position1: number, position2: number): Promise<QueueResourceClip> {
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

  async addClipToNowPlaying(queue_id_text: string, clip_id_text: string): Promise<QueueResourceClip> {
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

  async addClipToHistory(queue_id_text: string, clip_id_text: string): Promise<QueueResourceClip> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const clip = await this.clipService.getByIdText(clip_id_text);
    if (!clip) {
      throw new Error("Clip not found.");
    }

    const mostRecentHistoryItem = await this.queueResourceBaseService.getMostRecentHistoryItemByQueueIdText(queue_id_text);
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
}