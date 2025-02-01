import { AppDataSourceRead } from '@orm/db';
import { FeedFlagStatus } from '@orm/entities/feed/feedFlagStatus';

export class FeedFlagStatusService {
  private repositoryRead = AppDataSourceRead.getRepository(FeedFlagStatus);

  async get(id: number): Promise<FeedFlagStatus | null> {
    return await this.repositoryRead.findOne({
      where: { id },
    });
  }
}
