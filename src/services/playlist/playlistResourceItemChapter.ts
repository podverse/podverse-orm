import { EntityManager } from 'typeorm';
import { PlaylistResourceItemChapter } from '@orm/entities/playlist/playlistResourceItemChapter';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { PlaylistService } from '@orm/services/playlist/playlist';
import { ItemChapterService } from '@orm/services/item/itemChapter';
import { PLAYLIST_LIST_POSITION_INCREMENT } from '@orm/services/playlist/playlist';
import { PlaylistResourceBaseService } from '@orm/services/playlist/playlistResourceBase';

export class PlaylistResourceItemChapterService extends BaseManyService<PlaylistResourceItemChapter, 'playlist'> {
  private playlistService: PlaylistService;
  private itemChapterService: ItemChapterService;
  private playlistResourceBaseService: PlaylistResourceBaseService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(PlaylistResourceItemChapter, 'playlist', transactionalEntityManager);
    this.playlistService = new PlaylistService(transactionalEntityManager);
    this.itemChapterService = new ItemChapterService(transactionalEntityManager);
    this.playlistResourceBaseService = new PlaylistResourceBaseService(transactionalEntityManager);
  }

  private async addItemChapterToPlaylist(
    playlist_id_text: string,
    item_chapter_id_text: string,
    calculatePosition: (firstItem: PlaylistResourceItemChapter | null, lastItem: PlaylistResourceItemChapter | null) => string
  ): Promise<PlaylistResourceItemChapter> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const itemChapter = await this.itemChapterService.getByIdText(item_chapter_id_text);
    if (!itemChapter) {
      throw new Error("Item chapter not found.");
    }

    const { firstItem, lastItem } = await this.playlistResourceBaseService.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);

    const list_position = calculatePosition(firstItem as PlaylistResourceItemChapter, lastItem as PlaylistResourceItemChapter);

    const finalDto = {
      item_chapter: itemChapter,
      list_position
    };

    return this._update(
      playlist,
      ['playlist', 'item_chapter'],
      finalDto
    );
  }

  private async addItemChapterToPlaylistHelper(
    playlist_id_text: string,
    item_chapter_id_text: string,
    calculatePosition: (firstItem: PlaylistResourceItemChapter | null, lastItem: PlaylistResourceItemChapter | null) => string
  ): Promise<PlaylistResourceItemChapter> {
    return this.addItemChapterToPlaylist(playlist_id_text, item_chapter_id_text, calculatePosition);
  }

  async addItemChapterToPlaylistFirst(playlist_id_text: string, item_chapter_id_text: string): Promise<PlaylistResourceItemChapter> {
    return this.addItemChapterToPlaylistHelper(playlist_id_text, item_chapter_id_text, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - PLAYLIST_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addItemChapterToPlaylistLast(playlist_id_text: string, item_chapter_id_text: string): Promise<PlaylistResourceItemChapter> {
    return this.addItemChapterToPlaylistHelper(playlist_id_text, item_chapter_id_text, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + PLAYLIST_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addItemChapterToPlaylistBetween(playlist_id_text: string, item_chapter_id_text: string, position1?: number, position2?: number): Promise<PlaylistResourceItemChapter> {
    if (position1 === undefined || position2 === undefined) {
      throw new Error("Both position1 and position2 must be provided.");
    }

    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemChapterToPlaylistHelper(playlist_id_text, item_chapter_id_text, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async removeItemChapterFromPlaylist(playlist_id_text: string, item_chapter_id_text: string): Promise<void> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const itemChapter = await this.itemChapterService.getByIdText(item_chapter_id_text);
    if (!itemChapter) {
      throw new Error("Item chapter not found.");
    }

    return this._delete(playlist, { item_chapter_id: itemChapter.id });
  }
}