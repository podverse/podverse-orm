import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Clip } from '@orm/entities/clip';
import { PlaylistResourceBase } from '@orm/entities/playlist/playlistResourceBase';

@Entity()
export class PlaylistResourceClip extends PlaylistResourceBase {
  @Column()
  clip_id!: string;

  @ManyToOne(() => Clip, clip => clip.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clip_id' })
  clip!: Clip;
}