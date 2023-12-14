import createError from 'http-errors'
import { getRepository, In } from 'typeorm'
import { FeedUrl } from '../entities'
import { validateClassOrThrow } from '../lib/errors'
import { removeProtocol } from '../lib/misc'

const relations = ['podcast']

const getFeedUrl = async (id) => {
  const repository = getRepository(FeedUrl)
  const feedUrl = await repository.findOne({ id }, { relations })

  if (!feedUrl) {
    throw new createError.NotFound('FeedUrl not found')
  }

  return feedUrl
}

const getFeedUrlByUrl = async (url) => {
  const repository = getRepository(FeedUrl)

  const feedUrl = await repository
    .createQueryBuilder('feedUrl')
    .select('feedUrl.id')
    .addSelect('feedUrl.url')
    .innerJoinAndSelect('feedUrl.podcast', 'podcast')
    .where({ url })
    .getOne()

  if (!feedUrl) {
    throw new createError.NotFound('FeedUrl not found')
  }

  return feedUrl
}

const getFeedUrlByUrlIgnoreProtocolForPublicPodcast = async (url: string, skipNotFound = false) => {
  const repository = getRepository(FeedUrl)
  const feedUrlWithoutProtocol = removeProtocol(url)

  const feedUrl = await repository
    .createQueryBuilder('feedUrl')
    .select('feedUrl.id')
    .addSelect('feedUrl.url')
    .innerJoinAndSelect('feedUrl.podcast', 'podcast')
    .where('feedUrl.url LIKE :url', { url: `%${feedUrlWithoutProtocol}` })
    .andWhere('podcast.isPublic = TRUE')
    .getOne()

  if (!feedUrl && !skipNotFound) {
    throw new createError.NotFound('FeedUrl not found')
  }

  return feedUrl
}

const getFeedUrls = (query) => {
  const repository = getRepository(FeedUrl)

  if (query.podcastId) {
    query.podcast = In(query.podcastId)
  }

  if (query.url) {
    query.url = In(query.url)
  }

  return repository.find({
    where: {
      ...(query.podcast ? { podcast: query.podcast } : {}),
      ...(query.url ? { url: query.url } : {}),
      ...(query.isAuthority ? { isAuthority: true } : {})
    },
    skip: query.skip,
    take: query.take,
    relations
  })
}

export const getAuthorityFeedUrlByPodcastIndexId = async (podcastIndexId: string, allowNonPublic?: boolean) => {
  const repository = getRepository(FeedUrl)

  const qb = repository
    .createQueryBuilder('feedUrl')
    .select('feedUrl.id')
    .addSelect('feedUrl.url')
    .innerJoinAndSelect('feedUrl.podcast', 'podcast')
    .where('podcast."podcastIndexId')
    .where('podcast.podcastIndexId = :podcastIndexId', { podcastIndexId })

  if (!allowNonPublic) {
    qb.andWhere('feedUrl.isAuthority = TRUE')
  }

  const feedUrl = await qb.getOne()

  return feedUrl
}

const getFeedUrlsByPodcastIndexIds = async (podcastIndexIds: string[]) => {
  const repository = getRepository(FeedUrl)

  const feedUrl = await repository
    .createQueryBuilder('feedUrl')
    .select('feedUrl.id')
    .addSelect('feedUrl.url')
    .innerJoinAndSelect('feedUrl.podcast', 'podcast')
    .where('podcast.podcastIndexId IN (:...podcastIndexIds)', { podcastIndexIds })
    .andWhere('feedUrl.isAuthority = TRUE')
    .getMany()

  if (!feedUrl) {
    throw new createError.NotFound('FeedUrls not found')
  }

  return feedUrl
}

const updateFeedUrl = async (obj) => {
  const repository = getRepository(FeedUrl)
  const feedUrl = await repository.findOne({
    where: {
      id: obj.id
    }
  })

  if (!feedUrl) {
    throw new createError.NotFound('FeedUrl not found')
  }

  const newFeedUrl = Object.assign(feedUrl, obj)
  newFeedUrl.podcast = newFeedUrl.podcastId
  delete newFeedUrl.podcastId

  await validateClassOrThrow(newFeedUrl)

  await repository.save(newFeedUrl)
  return newFeedUrl
}

export {
  getFeedUrl,
  getFeedUrlsByPodcastIndexIds,
  getFeedUrlByUrl,
  getFeedUrlByUrlIgnoreProtocolForPublicPodcast,
  getFeedUrls,
  updateFeedUrl
}
