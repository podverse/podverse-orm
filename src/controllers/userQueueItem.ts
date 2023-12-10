import createError from 'http-errors'
import { getRepository } from 'typeorm'
import { cleanUserItemResult, cleanUserItemResults, generateGetUserItemsQuery } from './userHistoryItem'
import { UserQueueItem } from '../entities'

export const getUserQueueItems = async (loggedInUserId, useGetMany) => {
  const limit = 500
  const skip = 0
  return generateGetUserItemsQuery(UserQueueItem, 'userQueueItem', loggedInUserId, skip, limit, useGetMany)
}

export const getCleanedUserQueueItems = async (loggedInUserId, useGetMany: boolean) => {
  const results = await getUserQueueItems(loggedInUserId, useGetMany)
  const userQueueItems = cleanUserItemResults(results)
  return { userQueueItems }
}

export const addOrUpdateQueueItem = async (loggedInUserId, query) => {
  const { episodeId, mediaRefId, queuePosition } = query

  if (!episodeId && !mediaRefId) {
    throw new createError.NotFound('An episodeId or mediaRefId must be provided.')
  }

  if (episodeId && mediaRefId) {
    throw new createError.NotFound(
      'Either an episodeId or mediaRefId must be provided, but not both. Set null for the value that should not be included.'
    )
  }

  if (!queuePosition && queuePosition !== 0) {
    throw new createError.NotFound('A queuePosition must be provided.')
  }

  const useGetMany = false
  const queueItems = await getUserQueueItems(loggedInUserId, useGetMany)
  const existingIndex = queueItems.findIndex((x: any) => {
    if (x.clipId && mediaRefId) {
      return x.clipId === mediaRefId
    } else {
      return x.episodeId === episodeId
    }
  })

  // If the item is already in the queue, then remove it from the queue,
  // then insert the item with the new queuePosition.
  // Else, initialize a new UserQueueItem.
  let userQueueItem
  if (existingIndex >= 0) {
    userQueueItem = queueItems[existingIndex]
    queueItems.splice(existingIndex, 1)
  }

  userQueueItem = userQueueItem || new UserQueueItem()
  userQueueItem.episode = episodeId || null
  userQueueItem.mediaRef = mediaRefId || null
  userQueueItem.owner = loggedInUserId
  userQueueItem.queuePosition = queuePosition
  queueItems.push(userQueueItem)

  const sortedQueueItems = queueItems.sort((a, b) => a.queuePosition - b.queuePosition)

  await updateQueueItemsPositions(sortedQueueItems)
  const newQueueItems = await getCleanedUserQueueItems(loggedInUserId, useGetMany)
  return newQueueItems
}

const updateQueueItemsPositions = async (queueItems) => {
  const newSortedUserQueueItems = [] as any
  const queuePositionInterval = 1000

  for (let i = 0; i < queueItems.length; i++) {
    const item = queueItems[i]
    item.queuePosition = (i + 1) * queuePositionInterval
    newSortedUserQueueItems.push(item)
  }

  const repository = getRepository(UserQueueItem)
  await repository.save(newSortedUserQueueItems)
}

export const popNextFromQueue = async (loggedInUserId) => {
  const useGetMany = false
  const queueItems = await getUserQueueItems(loggedInUserId, useGetMany)
  let nextItem = queueItems.shift()

  if (!nextItem) {
    return {
      nextItem: null,
      userQueueItems: []
    }
  } else if (nextItem.clipId) {
    nextItem = cleanUserItemResult(nextItem)
    const newQueueItems = await removeUserQueueItemByMediaRefId(loggedInUserId, nextItem.clipId)
    return {
      nextItem,
      userQueueItems: newQueueItems.userQueueItems
    }
  } else {
    nextItem = cleanUserItemResult(nextItem)
    const newQueueItems = await removeUserQueueItemByEpisodeId(loggedInUserId, nextItem.episodeId)
    return {
      nextItem,
      userQueueItems: newQueueItems.userQueueItems
    }
  }
}

export const removeUserQueueItemByEpisodeId = async (loggedInUserId, episodeId) => {
  const useGetMany = false
  const queueItems = await getUserQueueItems(loggedInUserId, useGetMany)

  const queueItem = queueItems.find((x) => x.episodeId === episodeId)
  if (!queueItem) {
    // UserQueueItem not found with episodeId.
    return queueItems
  }
  const repository = getRepository(UserQueueItem)
  await repository.remove(queueItem)

  const remainingQueueItems = await getRawQueueItems(loggedInUserId)
  await updateQueueItemsPositions(remainingQueueItems)

  const newQueueItems = await getCleanedUserQueueItems(loggedInUserId, useGetMany)
  return newQueueItems
}

export const removeUserQueueItemByMediaRefId = async (loggedInUserId, mediaRefId) => {
  const useGetMany = false
  const queueItems = await getUserQueueItems(loggedInUserId, useGetMany)

  const queueItem = queueItems.find((x) => x.clipId === mediaRefId)
  if (!queueItem) {
    // UserQueueItem not found with mediaRefId.
    return queueItems
  }
  const repository = getRepository(UserQueueItem)
  await repository.remove(queueItem)

  const remainingQueueItems = await getRawQueueItems(loggedInUserId)
  await updateQueueItemsPositions(remainingQueueItems)

  const newQueueItems = await getCleanedUserQueueItems(loggedInUserId, useGetMany)
  return newQueueItems
}

export const removeAllUserQueueItems = async (loggedInUserId) => {
  const repository = getRepository(UserQueueItem)

  const userQueueItems = await repository.find({
    where: {
      owner: loggedInUserId
    }
  })

  return repository.remove(userQueueItems)
}

const getRawQueueItems = async (loggedInUserId) => {
  const repository = getRepository(UserQueueItem)
  return repository
    .createQueryBuilder('userQueueItem')
    .select('userQueueItem.id', 'id')
    .leftJoin(`userQueueItem.owner`, 'owner')
    .where('owner.id = :loggedInUserId', { loggedInUserId })
    .orderBy('userQueueItem.queuePosition', 'ASC')
    .getRawMany() as any
}
