import { EntityManager } from 'typeorm';
import { PlaylistResourceItemSoundbite } from '@orm/entities/playlist/playlistResourceItemSoundbite';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { PlaylistService } from '@orm/services/playlist/playlist';
import { ItemSoundbiteService } from '@orm/services/item/itemSoundbite';
import { PLAYLIST_LIST_POSITION_INCREMENT } from '@orm/services/playlist/playlist';
import { PlaylistResourceBaseService } from '@orm/services/playlist/playlistResourceBase';

export class PlaylistResourceItemSoundbiteService extends BaseManyService<PlaylistResourceItemSoundbite, 'playlist'> {
  private playlistService: PlaylistService;
  private itemSoundbiteService: ItemSoundbiteService;
  private playlistResourceBaseService: PlaylistResourceBaseService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(PlaylistResourceItemSoundbite, 'playlist', transactionalEntityManager);
    this.playlistService = new PlaylistService(transactionalEntityManager);
    this.itemSoundbiteService = new ItemSoundbiteService(transactionalEntityManager);
    this.playlistResourceBaseService = new PlaylistResourceBaseService(transactionalEntityManager);
  }

  private async addItemSoundbiteToPlaylist(
    playlist_id_text: string,
    soundbite_id_text: string,
    calculatePosition: (firstItem: PlaylistResourceItemSoundbite | null, lastItem: PlaylistResourceItemSoundbite | null) => string
  ): Promise<PlaylistResourceItemSoundbite> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const soundbite = await this.itemSoundbiteService.getByIdText(soundbite_id_text);
    if (!soundbite) {
      throw new Error("Soundbite not found.");
    }

    const { firstItem, lastItem } = await this.playlistResourceBaseService.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);

    const list_position = calculatePosition(firstItem as PlaylistResourceItemSoundbite, lastItem as PlaylistResourceItemSoundbite);

    const finalDto = {
      soundbite,
      list_position
    };

    return this._update(
      playlist,
      ['playlist', 'soundbite'],
      finalDto
    );
  }

  async addItemSoundbiteToPlaylistFirst(playlist_id_text: string, soundbite_id_text: string): Promise<PlaylistResourceItemSoundbite> {
    return this.addItemSoundbiteToPlaylist(playlist_id_text, soundbite_id_text, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - PLAYLIST_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addItemSoundbiteToPlaylistLast(playlist_id_text: string, soundbite_id_text: string): Promise<PlaylistResourceItemSoundbite> {
    return this.addItemSoundbiteToPlaylist(playlist_id_text, soundbite_id_text, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + PLAYLIST_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addItemSoundbiteToPlaylistBetween(playlist_id_text: string, soundbite_id_text: string, position1?: number, position2?: number): Promise<PlaylistResourceItemSoundbite> {
    if (position1 === undefined || position2 === undefined) {
      throw new Error("Both position1 and position2 must be provided.");
    }

    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemSoundbiteToPlaylist(playlist_id_text, soundbite_id_text, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async removeItemSoundbiteFromPlaylist(playlist_id_text: string, soundbite_id_text: string): Promise<void> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const soundbite = await this.itemSoundbiteService.getByIdText(soundbite_id_text);
    if (!soundbite) {
      throw new Error("Soundbite not found.");
    }

    return this._delete(playlist, { soundbite_id: soundbite.id });
  }
}