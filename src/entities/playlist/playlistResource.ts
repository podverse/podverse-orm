import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Playlist } from '@orm/entities/playlist/playlist';
import { Clip } from '../clip';
import { Item } from '../item/item';
import { ItemChapter } from '../item/itemChapter';
import { ItemSoundbite } from '../item/itemSoundbite';

@Entity()
@Unique(['playlist', 'list_position'])
export class PlaylistResource {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Playlist, playlist => playlist.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playlist_id' })
  playlist!: Playlist;

  @Column({ type: 'numeric' })
  list_position!: string;

  @Column()
  clip_id!: string;

  @ManyToOne(() => Clip, clip => clip.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clip_id' })
  clip!: Clip;

  @Column()
  item_id!: string;

  @ManyToOne(() => Item, item => item.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item!: Item;

  @Column()
  item_chapter_id!: number;

  @ManyToOne(() => ItemChapter, itemChapter => itemChapter.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_chapter_id' })
  item_chapter!: ItemChapter;

  @Column()
  item_soundbite_id!: number;

  @ManyToOne(() => ItemSoundbite, itemSoundbite => itemSoundbite.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_soundbite_id' })
  item_soundbite!: ItemSoundbite;

  @Column()
  add_by_rss_hash_id!: string;

  @Column({ type: 'jsonb' })
  add_by_rss_resource_data!: object;
}