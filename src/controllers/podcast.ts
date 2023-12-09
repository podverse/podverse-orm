import createError from 'http-errors'
import { getRepository } from 'typeorm'
import { FeedUrl, Podcast } from '../entities'

export const findPodcastsByFeedUrls = async (urls: string[]) => {
  const foundPodcastIds = [] as any
  const notFoundFeedUrls = [] as any

  // Limit to 2000 to prevent DOS'ing
  const limitedArray = urls.slice(0, 2000)
  for (const url of limitedArray) {
    const podcastId = await getPodcastIdByFeedUrl(url)
    if (podcastId) {
      foundPodcastIds.push(podcastId)
    } else {
      notFoundFeedUrls.push(url)
    }
  }

  return {
    foundPodcastIds,
    notFoundFeedUrls
  }
}

export const getPodcastByFeedUrl = async (feedUrl: string, includeRelations?: boolean) => {
  const podcastId = await getPodcastIdByFeedUrl(feedUrl)
  const repository = getRepository(Podcast)
  const podcast = await repository.findOne(
    {
      id: podcastId,
      isPublic: true
    },
    {
      relations: includeRelations ? ['authors', 'categories', 'feedUrls'] : []
    }
  )

  if (!podcast) {
    throw new createError.NotFound('Podcast not found')
  }

  return podcast
}

const getPodcastIdByFeedUrl = async (url: string) => {
  const repository = getRepository(FeedUrl)
  const feedUrl = await repository
    .createQueryBuilder('feedUrl')
    .select('feedUrl.url')
    .innerJoinAndSelect('feedUrl.podcast', 'podcast')
    .where('feedUrl.url = :url', { url })
    .getOne()

  if (!feedUrl || !feedUrl.podcast) return

  return feedUrl.podcast.id
}
