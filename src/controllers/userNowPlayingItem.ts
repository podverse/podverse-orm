import { getRepository } from 'typeorm'
import { User, UserNowPlayingItem } from '../entities'
import { validateClassOrThrow } from './lib/errors'
const createError = require('http-errors')

export const deleteUserNowPlayingItem = async (loggedInUserId) => {
  const repository = getRepository(UserNowPlayingItem)
  const userNowPlayingItem = await repository.findOne({
    where: { owner: loggedInUserId }
  })

  if (!userNowPlayingItem) {
    throw new createError.NotFound('UserNowPlayingItem not found')
  }

  return repository.remove(userNowPlayingItem)
}

export const getUserNowPlayingItem = async (loggedInUserId) => {
  if (!loggedInUserId) {
    throw new createError.Unauthorized('Log in to get the now playing item')
  }

  return getRepository(UserNowPlayingItem)
    .createQueryBuilder('userNowPlayingItem')
    .select('userNowPlayingItem.id', 'id')
    .addSelect('userNowPlayingItem.userPlaybackPosition', 'userPlaybackPosition')
    .addSelect('episode.id', 'episodeId')
    .addSelect('mediaRef.id', 'mediaRefId')
    .leftJoin('userNowPlayingItem.episode', 'episode')
    .leftJoin('userNowPlayingItem.mediaRef', 'mediaRef')
    .leftJoin('userNowPlayingItem.owner', 'owner')
    .where('owner.id = :loggedInUserId', { loggedInUserId })
    .getRawOne()
}

export const updateUserNowPlayingItem = async (nowPlayingItem, loggedInUserId) => {
  const { clipId, episodeId, liveItem, userPlaybackPosition = 0 } = nowPlayingItem

  if (!loggedInUserId) {
    throw new createError.Unauthorized('Log in to update the now playing item')
  }

  if (!clipId && !episodeId) {
    throw new createError.BadRequest('An episodeId or clipId must be provided.')
  }

  if (clipId && episodeId) {
    throw new createError.NotFound(
      'Either an episodeId or mediaRefId must be provided, but not both. Set null for the value that should not be included.'
    )
  }

  const currentNowPlayingItem = await getUserNowPlayingItem(loggedInUserId)
  const user = await getRepository(User).findOne({ id: loggedInUserId })

  if (!user) {
    throw new createError.BadRequest('Logged-in user not found')
  }

  const repository = getRepository(UserNowPlayingItem)
  const isLiveItem = !!liveItem
  const userNowPlayingItem = currentNowPlayingItem || new UserNowPlayingItem()
  delete userNowPlayingItem.episode
  delete userNowPlayingItem.episodeId
  delete userNowPlayingItem.mediaRef
  delete userNowPlayingItem.mediaRefId
  delete userNowPlayingItem.owner

  if (episodeId) {
    userNowPlayingItem.episode = episodeId
    userNowPlayingItem.mediaRef = null
  }

  if (clipId) {
    userNowPlayingItem.episode = null
    userNowPlayingItem.mediaRef = clipId
  }

  userNowPlayingItem.owner = loggedInUserId

  if (isLiveItem) {
    userNowPlayingItem.userPlaybackPosition = 0
  } else {
    userNowPlayingItem.userPlaybackPosition = userPlaybackPosition
  }

  await validateClassOrThrow(userNowPlayingItem)

  await repository.save(userNowPlayingItem)
}
