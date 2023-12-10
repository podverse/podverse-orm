import { JoinTable, ManyToMany, ManyToOne, ViewColumn, ViewEntity } from 'typeorm'
import { Author, Category, Episode, User } from './'

@ViewEntity('mediaRefs_videos')
export class MediaRefVideos {
  @ViewColumn()
  id: string

  @ViewColumn()
  int_id: number

  @ViewColumn()
  endTime: number

  @ViewColumn()
  imageUrl?: string

  @ViewColumn()
  isOfficialChapter: boolean

  @ViewColumn()
  isOfficialSoundBite: boolean

  @ViewColumn()
  isPublic: boolean

  @ViewColumn()
  linkUrl?: string

  @ViewColumn()
  pastHourTotalUniquePageviews: number

  @ViewColumn()
  pastDayTotalUniquePageviews: number

  @ViewColumn()
  pastWeekTotalUniquePageviews: number

  @ViewColumn()
  pastMonthTotalUniquePageviews: number

  @ViewColumn()
  pastYearTotalUniquePageviews: number

  @ViewColumn()
  pastAllTimeTotalUniquePageviews: number

  @ViewColumn()
  startTime: number

  @ViewColumn()
  title?: string

  @ManyToMany(() => Author)
  @JoinTable()
  authors: Author[]

  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[]

  @ManyToOne(() => Episode, (episode) => episode.mediaRefs)
  episode: Episode

  @ManyToOne(() => User, (user) => user.mediaRefs)
  owner: User

  @ViewColumn()
  createdAt: Date

  @ViewColumn()
  updatedAt: Date
}
