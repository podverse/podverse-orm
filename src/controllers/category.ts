import createError from 'http-errors'
import { getRepository } from 'typeorm'
import { Category } from '../entities'
import { validateSearchQueryString } from '../lib/validation'

const deleteCategoryByTitle = async (title) => {
  const repository = getRepository(Category)
  const category = await repository.findOne({
    where: { title }
  })

  if (!category) {
    throw new createError.NotFound('Category not found')
  }

  const result = await repository.remove(category)
  return result
}

const getCategory = async (id) => {
  const repository = getRepository(Category)
  const category = await repository.findOne(
    { id },
    {
      relations: ['category', 'category.category', 'categories']
    }
  )

  if (!category) {
    throw new createError.NotFound('Category not found')
  }

  return category
}

const getCategories = async (query) => {
  const repository = getRepository(Category)
  const categoryIds = (query.id && query.id.split(',')) || []
  const { slug, title, topLevelCategories } = query

  const qb = repository
    .createQueryBuilder('category')
    .select('category.id')
    .addSelect('category.slug')
    .addSelect('category.title')
    .leftJoin('category.category', 'categoryId')
    .leftJoin('category.categories', 'categories')
    .addSelect('categoryId.id')
    .addSelect('categoryId.slug')
    .addSelect('categoryId.title')
    .addSelect('categories.id')
    .addSelect('categories.slug')
    .addSelect('categories.title')

  if (categoryIds.length > 0) {
    qb.where('category.id IN (:...categoryIds)', { categoryIds })
  } else if (slug) {
    const slugLowerCase = `%${slug.toLowerCase().trim()}%`
    validateSearchQueryString(slugLowerCase)
    qb.where('LOWER(category.slug) LIKE :slug', { slug: slugLowerCase })
  } else if (title) {
    qb.where('category.title ILIKE :title', { title })
  } else if (topLevelCategories) {
    qb.where(`category.category IS NULL`)
  }

  const categories = await qb.orderBy('category.title', 'ASC').getManyAndCount()

  return categories
}

export { deleteCategoryByTitle, getCategory, getCategories }
