import { DATABASE_CONSTANTS, MediumEnum, SharableStatusEnum } from 'podverse-helpers';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BeforeInsert, Unique, OneToMany } from 'typeorm';
import { Account } from '@orm/entities/account/account';
import { SharableStatus } from '@orm/entities/sharableStatus';
import { Medium } from '@orm/entities/medium';
import { PlaylistResource } from './playlistResource';
const shortid = require('shortid');

@Entity()
@Unique(['account', 'medium', 'is_default_favorites'])
export class Playlist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  id_text!: string;

  @ManyToOne(() => Account, account => account.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => SharableStatus, sharableStatus => sharableStatus.id)
  @JoinColumn({ name: 'sharable_status_id' })
  sharable_status!: SharableStatusEnum;

  @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_normal })
  title?: string | null;

  @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_long })
  description?: string | null;

  @Column({ type: 'boolean', default: false })
  is_default_favorites!: boolean;

  @Column({ type: 'int', default: 0 })
  item_count!: number;

  @ManyToOne(() => Medium, medium => medium.id)
  @JoinColumn({ name: 'medium_id' })
  medium!: MediumEnum;

  @OneToMany(() => PlaylistResource, playlistResource => playlistResource.playlist)
  playlist_resources!: PlaylistResource[];

  @BeforeInsert()
  generateIdText() {
    this.id_text = shortid.generate();
  }
}