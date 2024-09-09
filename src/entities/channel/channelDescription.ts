import { DATABASE_CONSTANTS } from 'podverse-helpers';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Channel } from '@orm/entities/channel/channel';

@Entity()
@Unique(['channel'])
export class ChannelDescription {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Channel, channel => channel.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel!: Channel;

  @Column({ type: 'varchar', length: DATABASE_CONSTANTS.varchar_long })
  value!: string;
}
