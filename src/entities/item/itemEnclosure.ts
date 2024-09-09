import { DATABASE_CONSTANTS } from 'podverse-helpers';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Item } from '@orm/entities/item/item';

@Entity()
export class ItemEnclosure {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Item, item => item.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column({ type: 'varchar', length: DATABASE_CONSTANTS.varchar_short })
  type!: string;

  @Column({ type: 'int', nullable: true })
  length?: number | null;

  @Column({ type: 'int', nullable: true })
  bitrate?: number | null;

  @Column({ type: 'int', nullable: true })
  height?: number | null;

  @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_short })
  language?: string | null;

  @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_short })
  title?: string | null;

  @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_short })
  rel?: string | null;

  @Column({ type: 'varchar', nullable: true, length: DATABASE_CONSTANTS.varchar_short })
  codecs?: string | null;

  @Column({ type: 'boolean', default: false })
  item_enclosure_default!: boolean;
}