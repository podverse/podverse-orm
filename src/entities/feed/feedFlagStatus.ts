import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Feed } from './feed';

export enum FeedFlagStatusStatusEnum {
  Active = 1,
  AlwaysParse = 2,
  Spam = 3,
  PendingArchive = 4,
  Archived = 5,
  Takedown = 6
};

export const checkIfFeedFlagStatusShouldParse = (status: FeedFlagStatusStatusEnum) => {
  if (status === FeedFlagStatusStatusEnum.Active || status === FeedFlagStatusStatusEnum.AlwaysParse) {
    return true;
  }
  return false;
};

@Entity('feed_flag_status')
export class FeedFlagStatus {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: FeedFlagStatusStatusEnum,
    default: FeedFlagStatusStatusEnum.Active,
  })
  status!: FeedFlagStatusStatusEnum;

  @OneToMany(() => Feed, feed => feed.feed_flag_status)
  feeds!: Feed[];
}
