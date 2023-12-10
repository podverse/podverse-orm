import { IsInt, Min } from 'class-validator'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Episode, MediaRef } from './'
import { User } from './user'

@Entity('userNowPlayingItems')
export class UserNowPlayingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @IsInt()
  @Min(0)
  @Column({ default: 0 })
  userPlaybackPosition: number

  @ManyToOne(() => Episode, (episode) => episode.userNowPlayingItems, {
    onDelete: 'CASCADE'
  })
  episode: Episode

  @ManyToOne(() => MediaRef, (mediaRef) => mediaRef.userNowPlayingItems, {
    nullable: true,
    onDelete: 'CASCADE'
  })
  mediaRef: MediaRef

  @OneToOne(() => User, (user) => user.userNowPlayingItem, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn()
  owner: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
