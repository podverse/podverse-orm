import { logPerformance } from 'podverse-shared'
import { createConnection, ConnectionOptions } from 'typeorm'
import {
  AccountClaimToken,
  AppStorePurchase,
  Author,
  Category,
  Episode,
  EpisodeMostRecent,
  FCMDevice,
  FeedUrl,
  GooglePlayPurchase,
  LiveItem,
  MediaRef,
  MediaRefVideos,
  Notification,
  PayPalOrder,
  Playlist,
  Podcast,
  RecentEpisodeByCategory,
  RecentEpisodeByPodcast,
  UPDevice,
  User,
  UserHistoryItem,
  UserNowPlayingItem,
  UserQueueItem
} from './entities'
import { config } from './config'

const entities = [
  AccountClaimToken,
  AppStorePurchase,
  Author,
  Category,
  Episode,
  EpisodeMostRecent,
  FCMDevice,
  FeedUrl,
  GooglePlayPurchase,
  LiveItem,
  MediaRef,
  MediaRefVideos,
  Notification,
  PayPalOrder,
  Playlist,
  Podcast,
  RecentEpisodeByCategory,
  RecentEpisodeByPodcast,
  UPDevice,
  User,
  UserHistoryItem,
  UserNowPlayingItem,
  UserQueueItem
]

const options = config.db

const connectionOptions: ConnectionOptions = {
  type: 'postgres',
  host: options.host,
  port: options.port,
  username: options.username,
  password: options.password,
  database: options.database,
  synchronize: false,
  logging: false,
  entities,
  extra: {
    ssl: options.sslConnection
  }
}

/*
  connectToDb must be called before an app that imports podverse-orm
  can use orm helper functions.
*/
export const connectToDb = () => {
  logPerformance(`Connecting to the database`)
  return createConnection(connectionOptions)
}
