import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { ItemSoundbite } from '@orm/entities/item/itemSoundbite';
import { PlaylistResourceBase } from '@orm/entities/playlist/playlistResourceBase';

@Entity()
export class PlaylistResourceItemSoundbite extends PlaylistResourceBase {
  @Column()
  soundbite_id!: number;

  @ManyToOne(() => ItemSoundbite, itemSoundbite => itemSoundbite.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'soundbite_id' })
  soundbite!: ItemSoundbite;
}
