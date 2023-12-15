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

const connectionOptions: ConnectionOptions = {
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  synchronize: false,
  logging: false,
  entities,
  extra: {
    ssl: config.db.sslConnection
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
