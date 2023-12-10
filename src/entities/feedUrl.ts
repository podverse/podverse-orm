import { IsUrl } from 'class-validator'
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'
import { Podcast } from './'
import { generateShortId } from '../lib/shortid'

@Entity('feedUrls')
@Unique('index_feedUrlId_isAuthority', ['id', 'isAuthority'])
@Unique('feedUrl_index_podcastId_isAuthority', ['podcast', 'isAuthority'])
export class FeedUrl {
  @PrimaryColumn('varchar', {
    default: generateShortId(),
    length: 14
  })
  id: string

  @Index()
  @Column()
  @Generated('increment')
  int_id: number

  @Column({ default: null, nullable: true })
  isAuthority: boolean

  @Index()
  @IsUrl()
  @Column({ unique: true })
  url: string

  @ManyToOne(() => Podcast, (podcast) => podcast.feedUrls, {
    onDelete: 'CASCADE'
  })
  podcast: Podcast

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @BeforeInsert()
  beforeInsert() {
    this.id = generateShortId()
  }
}
