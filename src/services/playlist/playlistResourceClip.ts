import { EntityManager } from 'typeorm';
import { PlaylistResourceClip } from '@orm/entities/playlist/playlistResourceClip';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { PlaylistService, LIST_POSITION_INCREMENT } from '@orm/services/playlist/playlist';
import { ClipService } from '../clip';
import { PlaylistResourceBaseService } from '@orm/services/playlist/playlistResourceBase';

export class PlaylistResourceClipService extends BaseManyService<PlaylistResourceClip, 'playlist'> {
  private playlistService: PlaylistService;
  private clipService: ClipService;
  private playlistResourceBaseService: PlaylistResourceBaseService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(PlaylistResourceClip, 'playlist', transactionalEntityManager);
    this.playlistService = new PlaylistService(transactionalEntityManager);
    this.clipService = new ClipService(transactionalEntityManager);
    this.playlistResourceBaseService = new PlaylistResourceBaseService(transactionalEntityManager);
  }

  private async addClipToPlaylist(
    playlist_id_text: string,
    clip_id_text: string,
    calculatePosition: (firstItem: PlaylistResourceClip | null, lastItem: PlaylistResourceClip | null) => string
  ): Promise<PlaylistResourceClip> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const clip = await this.clipService.getByIdText(clip_id_text);
    if (!clip) {
      throw new Error("Clip not found.");
    }

    const { firstItem, lastItem } = await this.playlistResourceBaseService.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);

    const list_position = calculatePosition(firstItem as PlaylistResourceClip, lastItem as PlaylistResourceClip);

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
    calculatePosition: (firstItem: PlaylistResourceClip | null, lastItem: PlaylistResourceClip | null) => string
  ): Promise<PlaylistResourceClip> {
    return this.addClipToPlaylist(playlist_id_text, clip_id_text, calculatePosition);
  }

  async addClipToPlaylistFirst(playlist_id_text: string, clip_id_text: string): Promise<PlaylistResourceClip> {
    return this.addClipToPlaylistHelper(playlist_id_text, clip_id_text, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addClipToPlaylistLast(playlist_id_text: string, clip_id_text: string): Promise<PlaylistResourceClip> {
    return this.addClipToPlaylistHelper(playlist_id_text, clip_id_text, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + LIST_POSITION_INCREMENT).toString() : '1';
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

      return ((pos1 + pos2) / 2).toString();
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