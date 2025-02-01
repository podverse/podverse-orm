import { AppDataSourceRead } from '@orm/db';
import { Medium } from '@orm/entities/medium';

export class MediumService {
  private repositoryRead = AppDataSourceRead.getRepository(Medium);

  async mediumGetAll(): Promise<Medium[]> {
    return await this.repositoryRead.find();
  }
}
