import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { ItemChapter } from '@orm/entities/item/itemChapter';
import { PlaylistResourceBase } from '@orm/entities/playlist/playlistResourceBase';

@Entity()
export class PlaylistResourceItemChapter extends PlaylistResourceBase {
  @Column()
  item_chapter_id!: number;

  @ManyToOne(() => ItemChapter, itemChapter => itemChapter.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_chapter_id' })
  item_chapter!: ItemChapter;
}