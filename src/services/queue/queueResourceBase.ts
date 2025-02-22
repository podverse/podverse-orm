import { EntityManager, FindOptionsOrderValue, LessThan, MoreThan } from 'typeorm';
import { QueueResourceBase } from '@orm/entities/queue/queueResourceBase';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { QueueService } from '@orm/services/queue/queue';

export class QueueResourceBaseService extends BaseManyService<QueueResourceBase, 'queue'> {
  private queueService: QueueService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(QueueResourceBase, 'queue', transactionalEntityManager);
    this.queueService = new QueueService(transactionalEntityManager);
  }

  async getAllByQueueId(queue_id_text: string): Promise<QueueResourceBase[]> {
    const queue = await this.queueService.getByIdText(queue_id_text);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const options = {
      where: { queue: { id: queue.id } },
      order: { list_position: 'ASC' as FindOptionsOrderValue }
    };

    return this.repositoryRead.find(options);
  }

  async getFirstAndLastQueuedItemsByQueueIdText(queue_id_text: string): Promise<{ firstQueued: QueueResourceBase | null, lastQueued: QueueResourceBase | null }> {
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

  async getMostRecentHistoryItemByQueueIdText(queue_id_text: string): Promise<QueueResourceBase | null> {
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
}
