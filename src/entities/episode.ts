import { IsUrl, IsInt, Min, ValidateIf } from 'class-validator'
import {
  EpisodeAlternateEnclosure,
  EpisodeContentLinks,
  Funding,
  SocialInteraction,
  Transcript,
  ValueTagOriginal
} from 'podverse-shared'
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm'
import {
  Author,
  Category,
  LiveItem,
  MediaRef,
  Podcast,
  UserHistoryItem,
  UserNowPlayingItem,
  UserQueueItem
} from './'
import { generateShortId } from '../lib/shortid'

@Entity('episodes')
@Index(['isPublic', 'pubDate'])
@Index(['mediaType', 'pastAllTimeTotalUniquePageviews'])
@Index(['mediaType', 'pastHourTotalUniquePageviews'])
@Index(['mediaType', 'pastDayTotalUniquePageviews'])
@Index(['mediaType', 'pastWeekTotalUniquePageviews'])
@Index(['mediaType', 'pastMonthTotalUniquePageviews'])
@Index(['mediaType', 'pastYearTotalUniquePageviews'])
export class Episode {
  @PrimaryColumn('varchar', {
    default: generateShortId(),
    length: 14
  })
  id: string

  // TODO: generate this column without server downtime
  // @Column()
  // @Generated('increment')
  // int_id: number

  @Column('simple-json', { nullable: true })
  alternateEnclosures: EpisodeAlternateEnclosure[] | null

  @Column({ nullable: true })
  chaptersType?: string | null

  @ValidateIf((a) => a.chaptersUrl != null)
  @IsUrl()
  @Column({ nullable: true })
  chaptersUrl?: string | null

  @Column({ nullable: true })
  chaptersUrlLastParsed: Date | null

  @Column('simple-json', { nullable: true })
  contentLinks: EpisodeContentLinks[] | null

  @Column({ default: false })
  credentialsRequired: boolean

  @Column({ nullable: true })
  description?: string | null

  @ValidateIf((a) => a.duration != null)
  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  duration?: number

  @Column({ nullable: true })
  episodeType?: string | null

  @Column('simple-json', { nullable: true })
  funding: Funding[] | null

  @Index()
  @Column({ nullable: true })
  guid?: string | null

  @ValidateIf((a) => a.imageUrl != null)
  @IsUrl()
  @Column({ nullable: true })
  imageUrl?: string | null

  @Column({ default: false })
  isExplicit: boolean

  @Index()
  @Column({ default: false })
  isPublic: boolean

  @Index()
  @Column({ nullable: true })
  itunesEpisode?: number | null

  @Index()
  @Column({ nullable: true })
  itunesEpisodeType?: string | null

  @Index()
  @Column({ nullable: true })
  itunesSeason?: number | null

  @ValidateIf((a) => a.linkUrl != null)
  @IsUrl()
  @Column({ nullable: true })
  linkUrl?: string | null

  @ValidateIf((a) => a.mediaFilesize != null)
  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  mediaFilesize: number

  @Index()
  @Column({ nullable: true })
  mediaType?: string | null

  @Index()
  @IsUrl()
  @Column()
  mediaUrl: string

  @Index()
  @ValidateIf((a) => a.pastHourTotalUniquePageviews != null)
  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  pastHourTotalUniquePageviews: number

  @Index()
  @ValidateIf((a) => a.pastDayTotalUniquePageviews != null)
  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  pastDayTotalUniquePageviews: number

  @Index()
  @ValidateIf((a) => a.pastWeekTotalUniquePageviews != null)
  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  pastWeekTotalUniquePageviews: number

  @Index()
  @ValidateIf((a) => a.pastMonthTotalUniquePageviews != null)
  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  pastMonthTotalUniquePageviews: number

  @Index()
  @ValidateIf((a) => a.pastYearTotalUniquePageviews != null)
  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  pastYearTotalUniquePageviews: number

  @Index()
  @ValidateIf((a) => a.pastAllTimeTotalUniquePageviews != null)
  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  pastAllTimeTotalUniquePageviews: number

  @Column({ nullable: true })
  pubDate?: Date | null

  @Column('simple-json', { nullable: true })
  socialInteraction: SocialInteraction[] | null

  @Column({ nullable: true })
  subtitle?: string | null

  @Index()
  @Column({ nullable: true })
  title?: string | null

  @Column('simple-json', { nullable: true })
  transcript: Transcript[] | null

  @Column('simple-json', { nullable: true })
  value: ValueTagOriginal[] | null

  @ManyToMany(() => Author)
  @JoinTable()
  authors: Author[]

  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[]

  @OneToOne(() => LiveItem, (liveItem) => liveItem.episode, {
    cascade: true,
    nullable: true
  })
  liveItem: LiveItem | null

  @OneToMany(() => MediaRef, (mediaRef) => mediaRef.episode)
  mediaRefs: MediaRef[]

  @Index()
  @ManyToOne(() => Podcast, (podcast) => podcast.episodes, {
    onDelete: 'CASCADE'
  })
  podcast: Podcast

  // TODO: can/should this be removed?
  @Index()
  @Column()
  podcastId: string

  @OneToMany(() => UserHistoryItem, (userHistoryItem) => userHistoryItem.episode)
  userHistoryItems: UserHistoryItem[]

  @OneToMany(() => UserNowPlayingItem, (userNowPlayingItem) => userNowPlayingItem.episode, { nullable: true })
  userNowPlayingItems: UserNowPlayingItem[]

  @OneToMany(() => UserQueueItem, (userQueueItem) => userQueueItem.episode)
  userQueueItems: UserQueueItem[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @BeforeInsert()
  beforeInsert() {
    this.id = generateShortId()
    this.podcastId = this.podcast.id
  }

  @BeforeInsert()
  @BeforeUpdate()
  beforeAll() {
    if (this.guid) {
      this.guid = this.guid.trim() === '' ? '' : this.guid.trim()
    }
  }
}
