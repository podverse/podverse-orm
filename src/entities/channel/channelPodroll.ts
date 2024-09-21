import { Entity, PrimaryGeneratedColumn, JoinColumn, OneToOne } from 'typeorm';
import { Channel } from '@orm/entities/channel/channel';

@Entity()
export class ChannelPodroll {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Channel, channel => channel.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel!: Channel;
}
