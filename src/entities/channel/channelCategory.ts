import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Channel } from '@orm/entities/channel/channel';

@Entity('channel_category')
export class ChannelCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'category_id' })
  category_id!: number;

  @ManyToOne(() => Channel, channel => channel.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel!: Channel;
};
