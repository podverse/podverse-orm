import { DATABASE_CONSTANTS } from 'podverse-helpers';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Channel } from '@orm/entities/channel/channel';

@Entity({ name: 'channel_value' })
export class ChannelValue {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Channel, channel => channel.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel!: Channel;

  @Column({ type: 'varchar', name: 'type', length: DATABASE_CONSTANTS.varchar_short })
  type!: string;

  @Column({ type: 'varchar', name: 'method', length: DATABASE_CONSTANTS.varchar_short })
  method!: string;

  @Column({ type: 'float', name: 'suggested', nullable: true })
  suggested!: number | null;
}
