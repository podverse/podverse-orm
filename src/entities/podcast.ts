import { IsUrl, IsInt, Min, ValidateIf } from 'class-validator'
import { Funding, podcastItunesTypeDefaultValue, LiveItemStatus, PodcastMedium, ValueTagOriginal } from 'podverse-shared'
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm'
import { Author, Category, Episode, FeedUrl, Notification } from './'
import { generateShortId } from '../lib/shortid'

@Index(['hasVideo', 'pastAllTimeTotalUniquePageviews'])
@Index(['hasVideo', 'pastHourTotalUniquePageviews'])
@Index(['hasVideo', 'pastDayTotalUniquePageviews'])
@Index(['hasVideo', 'pastWeekTotalUniquePageviews'])
@Index(['hasVideo', 'pastMonthTotalUniquePageviews'])
@Index(['hasVideo', 'pastYearTotalUniquePageviews'])
@Index(['medium', 'pastAllTimeTotalUniquePageviews'])
@Index(['medium', 'pastHourTotalUniquePageviews'])
@Index(['medium', 'pastDayTotalUniquePageviews'])
@Index(['medium', 'pastWeekTotalUniquePageviews'])
@Index(['medium', 'pastMonthTotalUniquePageviews'])
@Index(['medium', 'pastYearTotalUniquePageviews'])
@Entity('podcasts')
export class Podcast {
  @PrimaryColumn('varchar', {
    default: generateShortId(),
    length: 14
  })
  id: string

  @Index()
  @Column()
  @Generated('increment')
  int_id: number

  @Index()
  @Column({ nullable: true, unique: true })
  podcastIndexId?: string | null

  // This replaces the podcast.guid column
  @Index()
  @Column({ type: 'uuid', nullable: true })
  podcastGuid?: string | null

  // deprecated: use podcastGuid instead
  @Column({ nullable: true })
  guid?: string | null

  @Index()
  @Column({ nullable: true, unique: true })
  authorityId?: string | null

  @Column({ default: false })
  alwaysFullyParse?: boolean

  @Column({ default: false })
  credentialsRequired: boolean

  @Column({ nullable: true })
  description?: string | null

  @Column({ nullable: true })
  embedApprovedMediaUrlPaths?: string | null

  @Column({ default: false })
  excludeCacheBust?: boolean

  @Column({ default: false })
  feedLastParseFailed?: boolean

  @Index()
  @Column({ nullable: true })
  feedLastUpdated?: Date | null

  @Column('simple-json', { nullable: true })
  funding: Funding[] | null

  @Column({ default: false })
  hasLiveItem: boolean

  @Column({ default: false })
  hasPodcastIndexValueTag?: boolean

  @Column({ default: false })
  hasSeasons: boolean

  @Column({ default: false })
  hasVideo: boolean

  @Column({ default: false })
  hideDynamicAdsWarning?: boolean

  @ValidateIf((a) => a.imageUrl != null)
  @IsUrl()
  @Column({ nullable: true })
  imageUrl?: string | null

  @Column({ default: false })
  isExplicit: boolean

  @Index()
  @Column({ default: false })
  isPublic: boolean

  @Column({ default: podcastItunesTypeDefaultValue })
  itunesFeedType: string

  @Column({ nullable: true })
  language?: string | null

  @Index()
  @Column({ nullable: true })
  lastEpisodePubDate?: Date | null

  @Column({ nullable: true })
  lastEpisodeTitle?: string | null

  @Column({ nullable: true })
  lastFoundInPodcastIndex?: Date | null

  @Index()
  @Column({
    type: 'enum',
    enum: ['pending', 'live', 'ended', 'none'],
    default: 'none'
  })
  latestLiveItemStatus: LiveItemStatus

  @ValidateIf((a) => a.linkUrl != null)
  @IsUrl()
  @Column({ nullable: true })
  linkUrl?: string | null

  // TODO: the Podcast.medium enum is currently missing the "mixed" value.
  // It is also missing Medium Lists values (podcastL, musicL, etc.),
  // but I don't know how those would fit into our UX yet.
  @Index()
  @Column({
    type: 'enum',
    enum: ['podcast', 'music', 'video', 'film', 'audiobook', 'newsletter', 'blog', 'music-video'],
    default: 'podcast'
  })
  medium: PodcastMedium

  @Column({ default: false })
  parsingPriority: boolean

  @Index()
  @ValidateIf((a) => a.pastAllTimeTotalUniquePageviews != null)
  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  pastAllTimeTotalUniquePageviews: number

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

  @ValidateIf((a) => a.shrunkImageUrl != null)
  @IsUrl()
  @Column({ nullable: true })
  shrunkImageUrl?: string | null

  @Index()
  @Column({ nullable: true })
  shrunkImageLastUpdated?: Date | null

  @Index()
  @Column({ nullable: true })
  sortableTitle?: string | null

  @Column({ nullable: true })
  subtitle?: string | null

  @Index()
  @Column({ nullable: true })
  title?: string | null

  @Column({ nullable: true })
  type?: string | null

  @Column('simple-json', { nullable: true })
  value: ValueTagOriginal[] | null

  @ManyToMany(() => Author, (author) => author.podcasts)
  @JoinTable()
  authors: Author[]

  @ManyToMany(() => Category, (category) => category.podcasts)
  @JoinTable()
  categories: Category[]

  @OneToMany(() => Episode, (episode) => episode.podcast)
  episodes?: Episode[]

  @OneToMany(() => FeedUrl, (feedUrl) => feedUrl.podcast)
  feedUrls?: FeedUrl[]

  @OneToMany(() => Notification, (notification) => notification.podcast)
  notifications?: Notification[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @BeforeInsert()
  beforeInsert() {
    this.id = generateShortId()
  }

  @BeforeInsert()
  @BeforeUpdate()
  beforeAll() {
    if (this.description) {
      this.description = this.description.trim() === '' ? undefined : this.description.trim()
    }
    if (this.guid) {
      this.guid = this.guid.trim() === '' ? undefined : this.guid.trim()
    }
    if (this.title) {
      this.title = this.title.trim() === '' ? undefined : this.title.trim()
    }
  }
}
