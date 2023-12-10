import { CreateDateColumn, Entity, ManyToOne, UpdateDateColumn, Unique } from 'typeorm'
import { Podcast, User } from './'

@Entity('notifications')
@Unique('notifications_pkey', ['podcast', 'user'])
export class Notification {
  @ManyToOne(() => Podcast, (podcast) => podcast.notifications, {
    nullable: false,
    onDelete: 'CASCADE',
    primary: true
  })
  podcast: Podcast

  @ManyToOne(() => User, (user) => user.notifications, {
    nullable: false,
    onDelete: 'CASCADE',
    primary: true
  })
  user: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
