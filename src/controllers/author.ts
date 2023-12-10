import createError from 'http-errors'
import { getRepository } from 'typeorm'
import { Author } from '../entities'
import { validateSearchQueryString } from '../lib/validation'

const relations = []

const getAuthor = async (id) => {
  const repository = getRepository(Author)
  const author = await repository.findOne({ id }, { relations })

  if (!author) {
    throw new createError.NotFound('Author not found')
  }

  return author
}

const getAuthors = async (query) => {
  const repository = getRepository(Author)
  const authorIds = (query.id && query.id.split(',')) || []
  const { name, slug, skip, take } = query

  const qb = repository
    .createQueryBuilder('author')
    .select('author.id')
    .addSelect('author.name')
    .addSelect('author.slug')

  if (authorIds.length > 0) {
    qb.where('author.id IN (:...authorIds)', { authorIds })
  } else if (name) {
    const nameLowerCase = `%${name.toLowerCase().trim()}%`
    validateSearchQueryString(nameLowerCase)
    qb.where('LOWER(author.name) LIKE :name', { name: nameLowerCase })
  } else if (slug) {
    const slugLowerCase = `%${slug.toLowerCase().trim()}%`
    validateSearchQueryString(slugLowerCase)
    qb.where('LOWER(author.slug) LIKE :slug', { slug: slugLowerCase })
  }

  const authors = await qb.skip(skip).take(take).getManyAndCount()

  return authors
}

export { getAuthor, getAuthors }
