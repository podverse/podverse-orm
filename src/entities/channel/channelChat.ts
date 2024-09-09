import { DATABASE_CONSTANTS } from 'podverse-helpers';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Channel } from '@orm/entities/channel/channel';

@Entity()
export class ChannelChat {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Channel, channel => channel.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel!: Channel;

  @Column({ type: 'varchar', length: DATABASE_CONSTANTS.varchar_fqdn })
  server!: string;

  @Column({ type: 'varchar', length: DATABASE_CONSTANTS.varchar_short })
  protocol!: string;

  @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_normal })
  account_id!: string | null;

  @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_normal })
  space!: string | null;
}
