import { EntityManager } from 'typeorm';
import { PlaylistResourceItem } from '@orm/entities/playlist/playlistResourceItem';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { ItemService } from '@orm/services/item/item';
import { PlaylistService, LIST_POSITION_INCREMENT } from '@orm/services/playlist/playlist';
import { PlaylistResourceBaseService } from '@orm/services/playlist/playlistResourceBase';

export class PlaylistResourceItemService extends BaseManyService<PlaylistResourceItem, 'playlist'> {
  private playlistService: PlaylistService;
  private itemService: ItemService;
  private playlistResourceBaseService: PlaylistResourceBaseService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(PlaylistResourceItem, 'playlist', transactionalEntityManager);
    this.playlistService = new PlaylistService(transactionalEntityManager);
    this.itemService = new ItemService();
    this.playlistResourceBaseService = new PlaylistResourceBaseService(transactionalEntityManager);
  }

  private async addItemToPlaylist(
    playlist_id_text: string,
    item_id_text: string,
    calculatePosition: (firstItem: PlaylistResourceItem | null, lastItem: PlaylistResourceItem | null) => string
  ): Promise<PlaylistResourceItem> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const item = await this.itemService.getByIdText(item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    const { firstItem, lastItem } = await this.playlistResourceBaseService.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);

    const list_position = calculatePosition(firstItem as PlaylistResourceItem, lastItem as PlaylistResourceItem);

    const finalDto = {
      item,
      list_position
    };

    return this._update(
      playlist,
      ['playlist', 'item'],
      finalDto
    );
  }

  private async addItemToPlaylistHelper(
    playlist_id_text: string,
    item_id_text: string,
    calculatePosition: (firstItem: PlaylistResourceItem | null, lastItem: PlaylistResourceItem | null) => string
  ): Promise<PlaylistResourceItem> {
    return this.addItemToPlaylist(playlist_id_text, item_id_text, calculatePosition);
  }

  async addItemToPlaylistFirst(playlist_id_text: string, item_id_text: string): Promise<PlaylistResourceItem> {
    return this.addItemToPlaylistHelper(playlist_id_text, item_id_text, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addItemToPlaylistLast(playlist_id_text: string, item_id_text: string): Promise<PlaylistResourceItem> {
    return this.addItemToPlaylistHelper(playlist_id_text, item_id_text, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addItemToPlaylistBetween(playlist_id_text: string, item_id_text: string, position1?: number, position2?: number): Promise<PlaylistResourceItem> {
    if (position1 === undefined || position2 === undefined) {
      throw new Error("Both position1 and position2 must be provided.");
    }

    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemToPlaylistHelper(playlist_id_text, item_id_text, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async removeItemFromPlaylist(playlist_id_text: string, item_id_text: string): Promise<void> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const item = await this.itemService.getByIdText(item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    return this._delete(playlist, { item_id: item.id });
  }
}