import { EntityManager } from 'typeorm';
import { PlaylistResourceClip } from '@orm/entities/playlist/playlistResourceClip';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { PlaylistService } from '@orm/services/playlist/playlist';
import { ClipService } from '../clip';

export class PlaylistResourceClipService extends BaseManyService<PlaylistResourceClip, 'playlist'> {
  private playlistService: PlaylistService;
  private clipService: ClipService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(PlaylistResourceClip, 'playlist', transactionalEntityManager);
    this.playlistService = new PlaylistService(transactionalEntityManager);
    this.clipService = new ClipService(transactionalEntityManager);
  }

  private async addClipToPlaylist(
    playlist_id_text: string,
    clip_id_text: string,
    calculatePosition: (firstItem: PlaylistResourceClip | null, lastItem: PlaylistResourceClip | null) => number
  ): Promise<PlaylistResourceClip> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const clip = await this.clipService.getByIdText(clip_id_text);
    if (!clip) {
      throw new Error("Clip not found.");
    }

    const firstItem = await this.repositoryRead.findOne({
      where: { playlist },
      order: { list_position: 'ASC' }
    });

    const lastItem = await this.repositoryRead.findOne({
      where: { playlist },
      order: { list_position: 'DESC' }
    });

    const list_position = calculatePosition(firstItem, lastItem).toString();

    const finalDto = {
      clip,
      list_position
    };

    return this._update(
      playlist,
      ['playlist', 'clip'],
      finalDto
    );
  }

  private async addClipToPlaylistHelper(
    playlist_id_text: string,
    clip_id_text: string,
    calculatePosition: (firstItem: PlaylistResourceClip | null, lastItem: PlaylistResourceClip | null) => number
  ): Promise<PlaylistResourceClip> {
    return this.addClipToPlaylist(playlist_id_text, clip_id_text, calculatePosition);
  }

  async addClipToPlaylistFirst(playlist_id_text: string, clip_id_text: string): Promise<PlaylistResourceClip> {
    return this.addClipToPlaylistHelper(playlist_id_text, clip_id_text, (firstItem) => {
      return firstItem ? parseFloat(firstItem.list_position) / 2 : 1;
    });
  }

  async addClipToPlaylistLast(playlist_id_text: string, clip_id_text: string): Promise<PlaylistResourceClip> {
    return this.addClipToPlaylistHelper(playlist_id_text, clip_id_text, (_, lastItem) => {
      return lastItem ? parseFloat(lastItem.list_position) + 0.0000001 : 1;
    });
  }

  async addClipToPlaylistBetween(playlist_id_text: string, clip_id_text: string, position1?: number, position2?: number): Promise<PlaylistResourceClip> {
    if (position1 === undefined || position2 === undefined) {
      throw new Error("Both position1 and position2 must be provided.");
    }

    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addClipToPlaylistHelper(playlist_id_text, clip_id_text, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return (pos1 + pos2) / 2;
    });
  }

  async removeClipFromPlaylist(playlist_id_text: string, clip_id_text: string): Promise<void> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const clip = await this.clipService.getByIdText(clip_id_text);
    if (!clip) {
      throw new Error("Clip not found.");
    }

    return this._delete(playlist, { clip_id: clip.id });
  }
}
