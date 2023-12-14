import createError from 'http-errors'
import { removeAllSpaces } from 'podverse-shared'
import SqlString from 'sqlstring'
import { In, getRepository } from 'typeorm'
import { deleteNotification } from './notification'
import { getUserSubscribedPodcastIds } from './user'
import { config } from '../config'
import { FeedUrl, Podcast, User } from '../entities'
import { getManticoreOrderByColumnName, manticoreWildcardSpecialCharacters, searchApi } from '../lib/manticore'
import { addOrderByToQuery } from '../lib/misc'
import { validateSearchQueryString } from '../lib/validation'

const getPodcast = async (id, includeRelations = true, allowNonPublic?: boolean) => {
  const repository = getRepository(Podcast)
  const podcast = await repository.findOne(
    {
      id,
      ...(!!allowNonPublic ? {} : { isPublic: true })
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

const getPodcastByPodcastIndexId = async (podcastIndexId: string, includeRelations = true, allowNonPublic?: boolean) => {
  const repository = getRepository(Podcast)
  const podcast = await repository.findOne(
    {
      podcastIndexId,
      ...(!!allowNonPublic ? {} : { isPublic: true })
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

const getPodcastsByPodcastIndexIds = (podcastIndexIds: number[]) => {
  const repository = getRepository(Podcast)
  return repository.find({
    where: {
      podcastIndexId: In(podcastIndexIds)
    }
  })
}

const getPodcastByPodcastGuid = async (podcastGuid: string, includeRelations?: boolean) => {
  const repository = getRepository(Podcast)
  const podcast = await repository.findOne(
    {
      podcastGuid,
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

const getPodcastByFeedUrl = async (feedUrl: string, includeRelations?: boolean) => {
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

const findPodcastsByFeedUrls = async (urls: string[]) => {
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

const getPodcastIdByFeedUrl = async (url: string) => {
  const url1 = url
  const url2 = url.indexOf('https:') === 0
    ? url.replace('https:', 'http:')
    : url.replace('http:', 'https:')

  const repository = getRepository(FeedUrl)

  const getFeed = (url: string) => {
    return repository
    .createQueryBuilder('feedUrl')
    .select('feedUrl.url')
    .innerJoinAndSelect('feedUrl.podcast', 'podcast')
    .where('feedUrl.url = :url', { url })
    .getOne()
  }

  const feedUrl1 = await getFeed(url1)
  
  if (feedUrl1) {
    if (!feedUrl1?.podcast?.id) {
      throw new createError.NotFound('FeedUrl1 Podcast not found')
    } else {
      return feedUrl1.podcast.id
    }
  } else {
    const feedUrl2 = await getFeed(url2)
    if (!feedUrl2?.podcast?.id) {
      throw new createError.NotFound('FeedUrl1 Podcast not found')
    } else {
      return feedUrl2.podcast.id
    }
  }
}

const getSubscribedPodcasts = async (query, loggedInUserId) => {
  const subscribedPodcastIds = await getUserSubscribedPodcastIds(loggedInUserId)
  query.podcastId = subscribedPodcastIds.join(',')

  let podcasts
  if (query.searchTitle) {
    podcasts = await getPodcastsFromSearchEngine(query)
  } else {
    podcasts = await getPodcasts(query)
  }
  return podcasts
}

const getPodcastsFromSearchEngine = async (query) => {
  const { hasVideo, isMusic, podcastsOnly, searchTitle, skip, sort, take } = query

  const { orderByColumnName, orderByDirection } = getManticoreOrderByColumnName(sort)
  const cleanedSearchTitle = removeAllSpaces(searchTitle)
  if (!cleanedSearchTitle) throw new Error('Must provide a searchTitle.')
  const titleWithWildcards = manticoreWildcardSpecialCharacters(cleanedSearchTitle)

  let extraQuery = ``
  if (hasVideo) {
    extraQuery = `AND hasvideo = 1`
  } else if (isMusic) {
    extraQuery = `AND medium = 'music'`
  } else if (podcastsOnly) {
    extraQuery = `AND medium = 'podcast' OR hasvideo = 1`
  }

  const safeSqlString = SqlString.format(
    `
      SELECT *
      FROM idx_podcast
      WHERE match(?)
      ${extraQuery}
      ORDER BY weight() DESC, ${orderByColumnName} ${orderByDirection}
      LIMIT ?,?;
  `,
    [titleWithWildcards, skip, take]
  )

  const result = await searchApi.sql(safeSqlString)

  let podcastIds = [] as any[]
  const { data, total } = result

  if (Array.isArray(data)) {
    podcastIds = data.map((x: any) => x.podverse_id)
  } else {
    return [[], 0]
  }

  const podcastIdsString = podcastIds.join(',')
  if (!podcastIdsString) return [data, total]

  delete query.searchTitle
  delete query.skip
  query.podcastId = podcastIdsString

  const isFromManticoreSearch = true
  return getPodcasts(query, total, isFromManticoreSearch)
}

const getPodcasts = async (query, countOverride?, isFromManticoreSearch?) => {
  const repository = getRepository(Podcast)
  const {
    categories,
    hasVideo,
    includeAuthors,
    includeCategories,
    isMusic,
    maxResults,
    podcastId,
    podcastsOnly,
    searchAuthor,
    skip,
    sort,
    take
  } = query
  const podcastIds = (podcastId && podcastId.split(',')) || []

  let qb = repository
    .createQueryBuilder('podcast')
    .select('podcast.id')
    .addSelect('podcast.podcastIndexId')
    .addSelect('podcast.podcastGuid')
    .addSelect('podcast.credentialsRequired')
    .addSelect('podcast.description')
    .addSelect('podcast.feedLastUpdated')
    .addSelect('podcast.funding')
    .addSelect('podcast.hasLiveItem')
    .addSelect('podcast.hasSeasons')
    .addSelect('podcast.hasVideo')
    .addSelect('podcast.hideDynamicAdsWarning')
    .addSelect('podcast.imageUrl')
    .addSelect('podcast.isExplicit')
    .addSelect('podcast.itunesFeedType')
    .addSelect('podcast.lastEpisodePubDate')
    .addSelect('podcast.lastEpisodeTitle')
    .addSelect('podcast.lastFoundInPodcastIndex')
    .addSelect('podcast.latestLiveItemStatus')
    .addSelect('podcast.linkUrl')
    .addSelect('podcast.medium')
    .addSelect('podcast.pastHourTotalUniquePageviews')
    .addSelect('podcast.pastWeekTotalUniquePageviews')
    .addSelect('podcast.pastDayTotalUniquePageviews')
    .addSelect('podcast.pastMonthTotalUniquePageviews')
    .addSelect('podcast.pastYearTotalUniquePageviews')
    .addSelect('podcast.pastAllTimeTotalUniquePageviews')
    .addSelect('podcast.shrunkImageUrl')
    .addSelect('podcast.sortableTitle')
    .addSelect('podcast.subtitle')
    .addSelect('podcast.title')
    .addSelect('podcast.value')
    .addSelect('podcast.createdAt')
    .addSelect('feedUrls.url')
    .innerJoin('podcast.feedUrls', 'feedUrls', 'feedUrls.isAuthority = :isAuthority', { isAuthority: true })

  if (categories && categories.length > 0) {
    qb.innerJoinAndSelect('podcast.categories', 'categories', 'categories.id = :id', { id: categories[0] })
  } else {
    if (searchAuthor) {
      const name = `%${searchAuthor.toLowerCase().trim()}%`
      validateSearchQueryString(name)
      qb.innerJoinAndSelect('podcast.authors', 'authors', 'LOWER(authors.name) LIKE :name', { name })
      qb.innerJoinAndSelect('podcast.categories', 'categories')
    } else if (podcastIds.length) {
      qb.where('podcast.id IN (:...podcastIds)', { podcastIds })
    }
  }

  if (includeAuthors) {
    qb.leftJoinAndSelect('podcast.authors', 'authors')
  }

  if (includeCategories) {
    qb.leftJoinAndSelect('podcast.categories', 'categories')
  }

  qb.andWhere('"isPublic" = true')
  if (hasVideo) {
    qb.andWhere('podcast."hasVideo" IS true')
  }

  if (isMusic) {
    qb.andWhere(`podcast.medium = 'music'`)
  }

  if (podcastsOnly) {
    qb.andWhere(`(podcast.medium = 'podcast' OR podcast."hasVideo" IS true)`)
  }

  const allowRandom = !!podcastIds
  qb = addOrderByToQuery(qb, 'podcast', sort, 'lastEpisodePubDate', allowRandom, isFromManticoreSearch)

  try {
    let podcastResults
    let podcasts
    let podcastsCount

    if (categories?.length > 0 || podcastIds.length === 0) {
      podcastResults = await qb.offset(skip).limit(20).getMany()
      podcasts = podcastResults
      podcastsCount = 10000
    } else {
      podcastResults = await qb
        .offset(skip)
        .limit((maxResults && 1000) || take)
        .getManyAndCount()
      podcasts = podcastResults[0]
      podcastsCount = podcastResults[1]
    }

    const finalPodcastResults = [] as any

    if (podcastIds && podcastIds.length && isFromManticoreSearch) {
      podcasts.sort(function (p1, p2) {
        return podcastIds.indexOf(p1.id) - podcastIds.indexOf(p2.id)
      })
    }

    if (countOverride > 0) {
      podcastsCount = countOverride
    }

    finalPodcastResults.push(podcasts)
    finalPodcastResults.push(podcastsCount)

    return finalPodcastResults
  } catch (error) {
    console.log(error)
    return
  }
}

const getMetadata = async (query) => {
  const repository = getRepository(Podcast)
  const { podcastId } = query

  if (!podcastId) {
    return []
  }

  const podcastIds = podcastId.split(',')

  const qb = repository
    .createQueryBuilder('podcast')
    .select('podcast.id')
    .addSelect('podcast.credentialsRequired')
    .addSelect('podcast.feedLastUpdated')
    .addSelect('podcast.funding')
    .addSelect('podcast.hasLiveItem')
    .addSelect('podcast.hasVideo')
    .addSelect('podcast.hideDynamicAdsWarning')
    .addSelect('podcast.lastEpisodePubDate')
    .addSelect('podcast.lastEpisodeTitle')
    .addSelect('podcast.latestLiveItemStatus')
    .addSelect('podcast.medium')
    .addSelect('podcast.sortableTitle')
    .addSelect('podcast.subtitle')
    .addSelect('podcast.title')
    .addSelect('podcast.value')
    .where('podcast.id IN (:...podcastIds)', { podcastIds })
    .andWhere('"isPublic" = true')

  try {
    const podcasts = await qb.take(1000).getManyAndCount()

    return podcasts
  } catch (error) {
    console.log(error)
    return
  }
}

const getSubscribedPodcastIds = async (loggedInUserId) => {
  const repository = getRepository(User)
  const user = await repository.findOne({
    where: {
      id: loggedInUserId
    },
    select: ['id', 'subscribedPodcastIds']
  })

  if (!user) {
    throw new createError.NotFound('User not found')
  }

  return user.subscribedPodcastIds
}

const toggleSubscribeToPodcast = async (podcastId, loggedInUserId) => {
  if (!loggedInUserId) {
    throw new createError.Unauthorized('Log in to subscribe to this podcast')
  }

  const repository = getRepository(User)
  let subscribedPodcastIds = await getSubscribedPodcastIds(loggedInUserId)

  // If no podcastIds match the filter, add the podcastId.
  // Else, remove the podcastId.
  const filteredPodcasts = subscribedPodcastIds.filter((x) => x !== podcastId)
  const shouldSubscribe = filteredPodcasts.length === subscribedPodcastIds.length

  if (shouldSubscribe) {
    subscribedPodcastIds.push(podcastId)
  } else {
    subscribedPodcastIds = filteredPodcasts
  }

  await repository.update(loggedInUserId, { subscribedPodcastIds })

  if (!shouldSubscribe) {
    try {
      await deleteNotification(podcastId, loggedInUserId)
    } catch (error) {
      //
    }
  }

  return subscribedPodcastIds
}

const subscribeToPodcast = async (podcastId, loggedInUserId) => {
  if (!loggedInUserId) {
    throw new createError.Unauthorized('Log in to subscribe to this podcast')
  }

  const repository = getRepository(User)
  const user = await repository.findOne({
    where: {
      id: loggedInUserId
    },
    select: ['id', 'subscribedPodcastIds']
  })

  if (!user) {
    throw new createError.NotFound('User not found')
  }

  const subscribedPodcastIds = user.subscribedPodcastIds

  // If no podcastIds match the filter, add the podcastId.
  // Else, do nothing
  const filteredPodcasts = user.subscribedPodcastIds.filter((x) => x !== podcastId)
  if (filteredPodcasts.length === user.subscribedPodcastIds.length) {
    subscribedPodcastIds.push(podcastId)
    await repository.update(loggedInUserId, { subscribedPodcastIds })
  }

  return subscribedPodcastIds
}

type GetPodcastWebUrl = {
  podcastGuid?: string
  podcastIndexId?: string
}

const getPodcastWebUrl = async ({ podcastGuid, podcastIndexId }: GetPodcastWebUrl) => {
  if (podcastGuid) {
    const podcast = await getPodcastByPodcastGuid(podcastGuid)
    return {
      webUrl: `${config.websiteProtocol}://${config.websiteDomain}/podcast/${podcast.id}`
    }
  } else if (podcastIndexId) {
    const podcast = await getPodcastByPodcastIndexId(podcastIndexId)
    return {
      webUrl: `${config.websiteProtocol}://${config.websiteDomain}/podcast/${podcast.id}`
    }
  } else {
    throw new createError.NotFound('Podcast not found')
  }
}

export {
  findPodcastsByFeedUrls,
  getPodcast,
  getPodcasts,
  getPodcastByFeedUrl,
  getPodcastByPodcastGuid,
  getPodcastByPodcastIndexId,
  getPodcastsByPodcastIndexIds,
  getPodcastsFromSearchEngine,
  getMetadata,
  getSubscribedPodcasts,
  subscribeToPodcast,
  toggleSubscribeToPodcast,
  getPodcastWebUrl
}
