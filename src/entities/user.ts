import { IsEmail, IsUUID, Validate, ValidateIf } from 'class-validator'
import { NowPlayingItem } from 'podverse-shared'
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm'
import {
  AppStorePurchase,
  FCMDevice,
  GooglePlayPurchase,
  MediaRef,
  Notification,
  PayPalOrder,
  Playlist,
  UPDevice,
  UserHistoryItem,
  UserNowPlayingItem,
  UserQueueItem
} from './'
import { generateShortId } from '../lib/shortid'
import { ValidatePassword } from './validation/password'

@Entity('users')
export class User {
  @PrimaryColumn('varchar', {
    default: generateShortId(),
    length: 14
  })
  id: string

  @Index()
  @Column()
  @Generated('increment')
  int_id: number

  @Column('varchar', {
    array: true,
    default: () => 'array[]::text[]',
    select: false
  })
  addByRSSPodcastFeedUrls: string[]

  @Index()
  @IsEmail()
  @Column({
    select: false,
    unique: true
  })
  email: string

  @ValidateIf((a) => a.emailVerificationToken != null)
  @IsUUID()
  @Column({
    nullable: true,
    select: false,
    unique: true
  })
  emailVerificationToken: string | null

  @Column({
    nullable: true,
    select: false
  })
  emailVerificationTokenExpiration: Date | null

  @Column({
    default: false,
    select: false
  })
  emailVerified: boolean

  @Column({
    nullable: true,
    select: false
  })
  freeTrialExpiration: Date | null

  @Column({ default: false })
  isDevAdmin: boolean

  @Column({ default: false })
  isPodpingAdmin: boolean

  @Index()
  @Column({ default: false })
  isPublic: boolean

  @Column({
    nullable: true,
    select: false
  })
  membershipExpiration: Date | null

  @Index()
  @Column({ nullable: true })
  name: string | null

  @Validate(ValidatePassword)
  @Column({ select: false })
  password: string

  @ValidateIf((a) => a.resetPasswordToken != null)
  @IsUUID()
  @Column({
    nullable: true,
    select: false,
    unique: true
  })
  resetPasswordToken: string | null

  @Column({
    nullable: true,
    select: false
  })
  resetPasswordTokenExpiration: Date | null

  @Column('varchar', {
    array: true,
    default: () => 'array[]::text[]',
    select: false
  })
  roles: string[]

  @Column('varchar', {
    array: true,
    default: () => 'array[]::text[]',
    select: false
  })
  subscribedPlaylistIds: string[]

  @Column('varchar', {
    array: true,
    default: () => 'array[]::text[]',
    select: false
  })
  subscribedPodcastIds: string[]

  @Column('varchar', {
    array: true,
    default: () => 'array[]::text[]',
    select: false
  })
  subscribedUserIds: string[]

  @Column('simple-json', { select: false })
  historyItems: NowPlayingItem[]

  @Column('simple-json', { select: false })
  queueItems: NowPlayingItem[]

  @OneToMany(() => AppStorePurchase, (appStorePurchase) => appStorePurchase.owner)
  appStorePurchases: AppStorePurchase[]

  @OneToMany(() => FCMDevice, (fcmDevice) => fcmDevice.user)
  fcmDevices: FCMDevice[]

  @OneToMany(() => GooglePlayPurchase, (googlePlayPurchase) => googlePlayPurchase.owner)
  googlePlayPurchases: GooglePlayPurchase[]

  @OneToMany(() => MediaRef, (mediaRefs) => mediaRefs.owner)
  mediaRefs: MediaRef[]

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[]

  @OneToMany(() => PayPalOrder, (paypalOrder) => paypalOrder.owner)
  paypalOrders: PayPalOrder[]

  @OneToMany(() => Playlist, (playlist) => playlist.owner)
  playlists: Playlist[]

  @OneToMany(() => UPDevice, (upDevice) => upDevice.user)
  upDevices: UPDevice[]

  @OneToMany(() => UserHistoryItem, (userHistoryItem) => userHistoryItem.owner)
  userHistoryItems: UserHistoryItem[]

  @OneToOne(() => UserNowPlayingItem, (userNowPlayingItem) => userNowPlayingItem.owner)
  @JoinColumn()
  userNowPlayingItem: UserNowPlayingItem

  @OneToMany(() => UserQueueItem, (userQueueItem) => userQueueItem.owner)
  userQueueItems: UserQueueItem[]

  @CreateDateColumn({ select: false })
  createdAt: Date

  @UpdateDateColumn({ select: false })
  updatedAt: Date

  @BeforeInsert()
  beforeInsert() {
    this.id = generateShortId()
    this.email = this.email.toLowerCase()

    this.addByRSSPodcastFeedUrls = this.addByRSSPodcastFeedUrls || []
    this.subscribedPlaylistIds = this.subscribedPlaylistIds || []
    this.subscribedPodcastIds = this.subscribedPodcastIds || []
    this.subscribedUserIds = this.subscribedUserIds || []
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.email = this.email.toLowerCase()

    this.addByRSSPodcastFeedUrls = this.addByRSSPodcastFeedUrls || []
    this.subscribedPlaylistIds = this.subscribedPlaylistIds || []
    this.subscribedPodcastIds = this.subscribedPodcastIds || []
    this.subscribedUserIds = this.subscribedUserIds || []
  }
}
