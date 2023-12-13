import { IsInt, Min } from 'class-validator'
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Episode, MediaRef, User } from './'

@Entity('userQueueItems')
export class UserQueueItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  queuePosition: number

  @ManyToOne(() => Episode, (episode) => episode.userQueueItems, {
    nullable: true,
    onDelete: 'CASCADE'
  })
  episode: Episode | null

  @ManyToOne(() => MediaRef, (mediaRef) => mediaRef.userQueueItems, {
    nullable: true,
    onDelete: 'CASCADE'
  })
  mediaRef: MediaRef | null

  @Index()
  @ManyToOne(() => User, (user) => user.userQueueItems, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  owner: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
