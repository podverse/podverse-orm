import { DATABASE_CONSTANTS, SharableStatusEnum } from 'podverse-helpers';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Account } from '@orm/entities/account/account';
import { SharableStatus } from '@orm/entities/sharableStatus';

@Entity('clip_archived')
export class ClipArchived {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', unique: true })
    id_text!: string;

    @ManyToOne(() => Account, account => account.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'account_id' })
    account!: Account;

    @Column({ type: 'int' })
    channel_podcast_index_id!: number;

    @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_normal })
    channel_title!: string | null;

    @Column({ type: 'jsonb', nullable: true })
    channel_images!: object;

    @Column({ type: 'varchar', name: 'item_guid', nullable: true, length: DATABASE_CONSTANTS.varchar_uri })
    item_guid?: string | null;

    @Column({ type: 'varchar', name: 'item_guid_enclosure_url', length: DATABASE_CONSTANTS.varchar_url })
    item_guid_enclosure_url?: string | null;

    @Column({ type: 'jsonb' })
    item_alternate_enclosures!: object;

    @Column({ type: 'varchar', name: 'item_title', nullable: true, length: DATABASE_CONSTANTS.varchar_normal })
    item_title?: string | null;

    @Column({ type: 'timestamptz', name: 'item_pub_date', nullable: true })
    item_pub_date?: Date | null;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    start_time!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    end_time?: string | null;

    @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_normal })
    title?: string | null;

    @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_long })
    description?: string | null;

    @ManyToOne(() => SharableStatus, sharableStatus => sharableStatus.id)
    @JoinColumn({ name: 'sharable_status_id' })
    sharable_status!: SharableStatusEnum;
}