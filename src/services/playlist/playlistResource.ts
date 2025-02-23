import { EntityManager, FindOptionsOrderValue } from 'typeorm';
import { PlaylistResource } from '@orm/entities/playlist/playlistResource';
import { PlaylistService } from './playlist';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { ClipService } from '../clip';
import { ItemService } from '../item/item';
import { getMd5Hash } from 'podverse-helpers';
import { ItemChapterService } from '../item/itemChapter';
import { ItemSoundbiteService } from '../item/itemSoundbite';

const PLAYLIST_LIST_POSITION_INCREMENT = 0.00000001;

export class PlaylistResourceService extends BaseManyService<PlaylistResource, 'playlist'> {
  private playlistService: PlaylistService;
  private clipService: ClipService;
  private itemService: ItemService;
  private itemChapterService: ItemChapterService;
  private itemSoundbiteService: ItemSoundbiteService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(PlaylistResource, 'playlist', transactionalEntityManager);
    this.playlistService = new PlaylistService(transactionalEntityManager);
    this.clipService = new ClipService(transactionalEntityManager);
    this.itemService = new ItemService();
    this.itemChapterService = new ItemChapterService(transactionalEntityManager);
    this.itemSoundbiteService = new ItemSoundbiteService(transactionalEntityManager);
  }

  async getAllByPlaylistIdText(playlist_id_text: string): Promise<PlaylistResource[]> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const options = {
      where: { playlist: { id: playlist.id } },
      order: { list_position: 'ASC' as FindOptionsOrderValue }
    };

    return this.repositoryRead.find(options);
  }

  async getFirstAndLastItemsByPlaylistIdText(playlist_id_text: string): Promise<{ firstItem: PlaylistResource | null, lastItem: PlaylistResource | null }> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const firstItem = await this.repositoryRead.findOne({
      where: { playlist },
      order: { list_position: 'ASC' }
    });

    const lastItem = await this.repositoryRead.findOne({
      where: { playlist },
      order: { list_position: 'DESC' }
    });

    return { firstItem, lastItem };
  }

  private async addClipToPlaylist(
    playlist_id_text: string,
    clip_id_text: string,
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const clip = await this.clipService.getByIdText(clip_id_text);
    if (!clip) {
      throw new Error("Clip not found.");
    }

    const { firstItem, lastItem } = await this.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);

    const list_position = calculatePosition(firstItem as PlaylistResource, lastItem as PlaylistResource);

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
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    return this.addClipToPlaylist(playlist_id_text, clip_id_text, calculatePosition);
  }

  async addClipToPlaylistFirst(playlist_id_text: string, clip_id_text: string): Promise<PlaylistResource> {
    return this.addClipToPlaylistHelper(playlist_id_text, clip_id_text, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - PLAYLIST_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addClipToPlaylistLast(playlist_id_text: string, clip_id_text: string): Promise<PlaylistResource> {
    return this.addClipToPlaylistHelper(playlist_id_text, clip_id_text, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + PLAYLIST_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addClipToPlaylistBetween(playlist_id_text: string, clip_id_text: string, position1?: number, position2?: number): Promise<PlaylistResource> {
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

  private async addItemToPlaylist(
    playlist_id_text: string,
    item_id_text: string,
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const item = await this.itemService.getByIdText(item_id_text);
    if (!item) {
      throw new Error("Item not found.");
    }

    const { firstItem, lastItem } = await this.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);

    const list_position = calculatePosition(firstItem as PlaylistResource, lastItem as PlaylistResource);

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
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    return this.addItemToPlaylist(playlist_id_text, item_id_text, calculatePosition);
  }

  async addItemToPlaylistFirst(playlist_id_text: string, item_id_text: string): Promise<PlaylistResource> {
    return this.addItemToPlaylistHelper(playlist_id_text, item_id_text, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - PLAYLIST_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addItemToPlaylistLast(playlist_id_text: string, item_id_text: string): Promise<PlaylistResource> {
    return this.addItemToPlaylistHelper(playlist_id_text, item_id_text, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + PLAYLIST_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addItemToPlaylistBetween(playlist_id_text: string, item_id_text: string, position1?: number, position2?: number): Promise<PlaylistResource> {
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

  private async addItemAddByRSSToPlaylist(
    playlist_id_text: string,
    add_by_rss_resource_data: object,
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const { firstItem, lastItem } = await this.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);

    const list_position = calculatePosition(firstItem as PlaylistResource, lastItem as PlaylistResource);
    const add_by_rss_hash_id = getMd5Hash(add_by_rss_resource_data);

    const finalDto = {
      add_by_rss_resource_data,
      list_position,
      add_by_rss_hash_id
    };

    return this._update(
      playlist,
      ['playlist', 'add_by_rss_hash_id'],
      finalDto
    );
  }

  private async addItemAddByRSSToPlaylistHelper(
    playlist_id_text: string,
    add_by_rss_resource_data: object,
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    return this.addItemAddByRSSToPlaylist(playlist_id_text, add_by_rss_resource_data, calculatePosition);
  }

  async addItemAddByRSSToPlaylistFirst(playlist_id_text: string, add_by_rss_resource_data: object): Promise<PlaylistResource> {
    return this.addItemAddByRSSToPlaylistHelper(playlist_id_text, add_by_rss_resource_data, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - PLAYLIST_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addItemAddByRSSToPlaylistLast(playlist_id_text: string, add_by_rss_resource_data: object): Promise<PlaylistResource> {
    return this.addItemAddByRSSToPlaylistHelper(playlist_id_text, add_by_rss_resource_data, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + PLAYLIST_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addItemAddByRSSToPlaylistBetween(playlist_id_text: string, add_by_rss_resource_data: object, position1?: number, position2?: number): Promise<PlaylistResource> {
    if (position1 === undefined || position2 === undefined) {
      throw new Error("Both position1 and position2 must be provided.");
    }

    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemAddByRSSToPlaylistHelper(playlist_id_text, add_by_rss_resource_data, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async removeItemAddByRSSFromPlaylist(playlist_id_text: string, add_by_rss_hash_id: string): Promise<void> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    return this._delete(playlist, { add_by_rss_hash_id });
  }

  private async addItemChapterToPlaylist(
    playlist_id_text: string,
    item_chapter_id_text: string,
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const itemChapter = await this.itemChapterService.getByIdText(item_chapter_id_text);
    if (!itemChapter) {
      throw new Error("Item chapter not found.");
    }

    const { firstItem, lastItem } = await this.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);

    const list_position = calculatePosition(firstItem as PlaylistResource, lastItem as PlaylistResource);

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
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    return this.addItemChapterToPlaylist(playlist_id_text, item_chapter_id_text, calculatePosition);
  }

  async addItemChapterToPlaylistFirst(playlist_id_text: string, item_chapter_id_text: string): Promise<PlaylistResource> {
    return this.addItemChapterToPlaylistHelper(playlist_id_text, item_chapter_id_text, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - PLAYLIST_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addItemChapterToPlaylistLast(playlist_id_text: string, item_chapter_id_text: string): Promise<PlaylistResource> {
    return this.addItemChapterToPlaylistHelper(playlist_id_text, item_chapter_id_text, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + PLAYLIST_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addItemChapterToPlaylistBetween(playlist_id_text: string, item_chapter_id_text: string, position1?: number, position2?: number): Promise<PlaylistResource> {
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

    const item_chapter = await this.itemChapterService.getByIdText(item_chapter_id_text);
    if (!item_chapter) {
      throw new Error("Chapter not found.");
    }

    return this._delete(playlist, { item_chapter_id: item_chapter.id });
  }

  private async addItemSoundbiteToPlaylist(
    playlist_id_text: string,
    item_soundbite_id_text: string,
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const item_soundbite = await this.itemSoundbiteService.getByIdText(item_soundbite_id_text);
    if (!item_soundbite) {
      throw new Error("Soundbite not found.");
    }

    const { firstItem, lastItem } = await this.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);

    const list_position = calculatePosition(firstItem as PlaylistResource, lastItem as PlaylistResource);

    const finalDto = {
      item_soundbite,
      list_position
    };

    return this._update(
      playlist,
      ['playlist', 'item_soundbite'],
      finalDto
    );
  }

  async addItemSoundbiteToPlaylistFirst(playlist_id_text: string, item_soundbite_id_text: string): Promise<PlaylistResource> {
    return this.addItemSoundbiteToPlaylist(playlist_id_text, item_soundbite_id_text, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - PLAYLIST_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  async addItemSoundbiteToPlaylistLast(playlist_id_text: string, item_soundbite_id_text: string): Promise<PlaylistResource> {
    return this.addItemSoundbiteToPlaylist(playlist_id_text, item_soundbite_id_text, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + PLAYLIST_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  async addItemSoundbiteToPlaylistBetween(playlist_id_text: string, item_soundbite_id_text: string, position1?: number, position2?: number): Promise<PlaylistResource> {
    if (position1 === undefined || position2 === undefined) {
      throw new Error("Both position1 and position2 must be provided.");
    }

    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addItemSoundbiteToPlaylist(playlist_id_text, item_soundbite_id_text, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  async removeItemSoundbiteFromPlaylist(playlist_id_text: string, item_soundbite_id_text: string): Promise<void> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const item_soundbite = await this.itemSoundbiteService.getByIdText(item_soundbite_id_text);
    if (!item_soundbite) {
      throw new Error("Soundbite not found.");
    }

    return this._delete(playlist, { item_soundbite_id: item_soundbite.id });
  }
}
