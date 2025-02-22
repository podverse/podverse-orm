import { getMd5Hash } from 'podverse-helpers';
import { EntityManager } from 'typeorm';
import { PlaylistResourceItemAddByRss } from '@orm/entities/playlist/playlistResourceItemAddByRSS';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { PlaylistService, PLAYLIST_LIST_POSITION_INCREMENT } from '@orm/services/playlist/playlist';
import { PlaylistResourceBaseService } from '@orm/services/playlist/playlistResourceBase';

export class PlaylistResourceItemAddByRSSService extends BaseManyService<PlaylistResourceItemAddByRss, 'playlist'> {
  private playlistService: PlaylistService;
  private playlistResourceBaseService: PlaylistResourceBaseService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(PlaylistResourceItemAddByRss, 'playlist', transactionalEntityManager);
    this.playlistService = new PlaylistService(transactionalEntityManager);
    this.playlistResourceBaseService = new PlaylistResourceBaseService(transactionalEntityManager);
  }

  private async addItemToPlaylist(
    playlist_id_text: string,
    resource_data: object,
    calculatePosition: (firstItem: PlaylistResourceItemAddByRss | null, lastItem: PlaylistResourceItemAddByRss | null) => string
  ): Promise<PlaylistResourceItemAddByRss> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const { firstItem, lastItem } = await this.playlistResourceBaseService.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);

    const list_position = calculatePosition(firstItem as PlaylistResourceItemAddByRss, lastItem as PlaylistResourceItemAddByRss);
    const hash_id = getMd5Hash(resource_data);

    const finalDto = {
      resource_data,
      list_position,
      hash_id
    };

    return this._update(
      playlist,
      ['playlist', 'hash_id'],
      finalDto
    );
  }

  private async addItemToPlaylistHelper(
    playlist_id_text: string,
    resource_data: object,
    calculatePosition: (firstItem: PlaylistResourceItemAddByRss | null, lastItem: PlaylistResourceItemAddByRss | null) => string
  ): Promise<PlaylistResourceItemAddByRss> {
    return this.addItemToPlaylist(playlist_id_text, resource_data, calculatePosition);
  }

  async addItemToPlaylistFirst(playlist_id_text: string, resource_data: object): Promise<PlaylistResourceItemAddByRss> {
    return this.addItemToPlaylistHelper(playlist_id_text, resource_data, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - PLAYLIST_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addItemToPlaylistLast(playlist_id_text: string, resource_data: object): Promise<PlaylistResourceItemAddByRss> {
    return this.addItemToPlaylistHelper(playlist_id_text, resource_data, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + PLAYLIST_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addItemToPlaylistBetween(playlist_id_text: string, resource_data: object, position1?: number, position2?: number): Promise<PlaylistResourceItemAddByRss> {
    if (position1 === undefined || position2 === undefined) {
      throw new Error("Both position1 and position2 must be provided.");
    }

    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemToPlaylistHelper(playlist_id_text, resource_data, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async removeItemFromPlaylist(playlist_id_text: string, hash_id: string): Promise<void> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    return this._delete(playlist, { hash_id });
  }
}
