import { AppDataSourceRead } from '@orm/db';
import { Category } from '@orm/entities/category';

export class CategoryService {
  private repositoryRead = AppDataSourceRead.getRepository(Category);

  async categoryGetAll(): Promise<Category[]> {
    return await this.repositoryRead.find();
  }
}
