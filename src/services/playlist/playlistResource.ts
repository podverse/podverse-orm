// TODO: get rid of "any" in the file 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getMd5Hash } from 'podverse-helpers';
import { EntityManager, FindOptionsOrderValue } from 'typeorm';
import { PlaylistResource } from '@orm/entities/playlist/playlistResource';
import { PlaylistService } from './playlist';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { ClipService } from '../clip';
import { ItemService } from '../item/item';
import { ItemSoundbiteService } from '../item/itemSoundbite';

const PLAYLIST_LIST_POSITION_INCREMENT = 0.00000001;

export class PlaylistResourceService extends BaseManyService<PlaylistResource, 'playlist'> {
  private playlistService: PlaylistService;
  private clipService: ClipService;
  private itemService: ItemService;
  private itemSoundbiteService: ItemSoundbiteService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(PlaylistResource, 'playlist', transactionalEntityManager);
    this.playlistService = new PlaylistService(transactionalEntityManager);
    this.clipService = new ClipService(transactionalEntityManager);
    this.itemService = new ItemService();
    this.itemSoundbiteService = new ItemSoundbiteService(transactionalEntityManager);
  }

  async getAllByPlaylistIdText(playlist_id_text: string): Promise<PlaylistResource[]> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const options = {
      where: { playlist: { id: playlist.id } },
      order: { list_position: 'ASC' as FindOptionsOrderValue },
      relations: ['clip', 'item', 'item_soundbite']
    };

    return this.repositoryRead.find(options);
  }

  async getAllByPlaylistIdTextCount(playlist_id_text: string): Promise<number> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    return this.repositoryRead.count({ where: { playlist: { id: playlist.id } }});
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

  private async addResourceToPlaylist(
    playlist_id_text: string,
    resource_id_text: string,
    resourceService: any,
    resourceKey: keyof PlaylistResource,
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }
    
    const resource = await resourceService.getByIdText(resource_id_text);
    if (!resource) {
      throw new Error(`${resourceKey} not found.`);
    }

    const { firstItem, lastItem } = await this.getFirstAndLastItemsByPlaylistIdText(playlist_id_text);
    const list_position = calculatePosition(firstItem as PlaylistResource, lastItem as PlaylistResource);

    const finalDto = {
      [resourceKey]: resource.id,
      list_position
    };
    
    const results = await this._update(
      playlist,
      ['playlist', resourceKey],
      finalDto
    );

    await this.playlistService.updateLastUpdatedAndItemCount(playlist.id_text);

    return results;
  }

  private async addResourceToPlaylistHelper(
    playlist_id_text: string,
    resource_id_text: string,
    resourceService: any,
    resourceKey: keyof PlaylistResource,
    calculatePosition: (firstItem: PlaylistResource | null, lastItem: PlaylistResource | null) => string
  ): Promise<PlaylistResource> {
    return this.addResourceToPlaylist(playlist_id_text, resource_id_text, resourceService, resourceKey, calculatePosition);
  }

  private async addResourceToPlaylistFirst(
    playlist_id_text: string,
    resource_id_text: string,
    resourceService: any,
    resourceKey: keyof PlaylistResource
  ): Promise<PlaylistResource> {
    return this.addResourceToPlaylistHelper(playlist_id_text, resource_id_text, resourceService, resourceKey, (firstItem) => {
      const newPosition = firstItem ? parseFloat(firstItem.list_position) - PLAYLIST_LIST_POSITION_INCREMENT : 1;
      return newPosition < 0 ? '0' : newPosition.toString();
    });
  }

  private async addResourceToPlaylistLast(
    playlist_id_text: string,
    resource_id_text: string,
    resourceService: any,
    resourceKey: keyof PlaylistResource
  ): Promise<PlaylistResource> {
    return this.addResourceToPlaylistHelper(playlist_id_text, resource_id_text, resourceService, resourceKey, (_, lastItem) => {
      return lastItem ? (parseFloat(lastItem.list_position) + PLAYLIST_LIST_POSITION_INCREMENT).toString() : '1';
    });
  }

  private async addResourceToPlaylistBetween(
    playlist_id_text: string,
    resource_id_text: string,
    resourceService: any,
    resourceKey: keyof PlaylistResource,
    position1: number,
    position2: number
  ): Promise<PlaylistResource> {
    if (position1 === undefined || position2 === undefined) {
      throw new Error("Both position1 and position2 must be provided.");
    }

    if (position1 >= position2) {
      throw new Error("Position1 should be less than Position2.");
    }

    return this.addResourceToPlaylistHelper(playlist_id_text, resource_id_text, resourceService, resourceKey, () => {
      const pos1 = parseFloat(position1.toString());
      const pos2 = parseFloat(position2.toString());

      if (isNaN(pos1) || isNaN(pos2)) {
        throw new Error("Invalid positions provided.");
      }

      return ((pos1 + pos2) / 2).toString();
    });
  }

  private async removeResourceFromPlaylist(
    playlist_id_text: string,
    resource_id_text: string,
    resourceService: any,
    resourceKey: keyof PlaylistResource
  ): Promise<void> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const resource = await resourceService.getByIdText(resource_id_text);
    if (!resource) {
      throw new Error(`${resourceKey} not found.`);
    }

    return this._delete(playlist, { [`${resourceKey}_id`]: resource.id });
  }

  async addClipToPlaylistFirst(playlist_id_text: string, clip_id_text: string): Promise<PlaylistResource> {
    return this.addResourceToPlaylistFirst(playlist_id_text, clip_id_text, this.clipService, 'clip_id');
  }

  async addClipToPlaylistLast(playlist_id_text: string, clip_id_text: string): Promise<PlaylistResource> {
    return this.addResourceToPlaylistLast(playlist_id_text, clip_id_text, this.clipService, 'clip_id');
  }

  async addClipToPlaylistBetween(playlist_id_text: string, clip_id_text: string, position1: number, position2: number): Promise<PlaylistResource> {
    return this.addResourceToPlaylistBetween(playlist_id_text, clip_id_text, this.clipService, 'clip_id', position1, position2);
  }

  async removeClipFromPlaylist(playlist_id_text: string, clip_id_text: string): Promise<void> {
    return this.removeResourceFromPlaylist(playlist_id_text, clip_id_text, this.clipService, 'clip_id');
  }

  async addItemToPlaylistFirst(playlist_id_text: string, item_id_text: string): Promise<PlaylistResource> {
    return this.addResourceToPlaylistFirst(playlist_id_text, item_id_text, this.itemService, 'item_id');
  }

  async addItemToPlaylistLast(playlist_id_text: string, item_id_text: string): Promise<PlaylistResource> {
    return this.addResourceToPlaylistLast(playlist_id_text, item_id_text, this.itemService, 'item_id');
  }

  async addItemToPlaylistBetween(playlist_id_text: string, item_id_text: string, position1: number, position2: number): Promise<PlaylistResource> {
    return this.addResourceToPlaylistBetween(playlist_id_text, item_id_text, this.itemService, 'item_id', position1, position2);
  }

  async removeItemFromPlaylist(playlist_id_text: string, item_id_text: string): Promise<void> {
    return this.removeResourceFromPlaylist(playlist_id_text, item_id_text, this.itemService, 'item_id');
  }

  async addItemSoundbiteToPlaylistFirst(playlist_id_text: string, item_soundbite_id_text: string): Promise<PlaylistResource> {
    return this.addResourceToPlaylistFirst(playlist_id_text, item_soundbite_id_text, this.itemSoundbiteService, 'item_soundbite_id');
  }

  async addItemSoundbiteToPlaylistLast(playlist_id_text: string, item_soundbite_id_text: string): Promise<PlaylistResource> {
    return this.addResourceToPlaylistLast(playlist_id_text, item_soundbite_id_text, this.itemSoundbiteService, 'item_soundbite_id');
  }

  async addItemSoundbiteToPlaylistBetween(playlist_id_text: string, item_soundbite_id_text: string, position1: number, position2: number): Promise<PlaylistResource> {
    return this.addResourceToPlaylistBetween(playlist_id_text, item_soundbite_id_text, this.itemSoundbiteService, 'item_soundbite_id', position1, position2);
  }

  async removeItemSoundbiteFromPlaylist(playlist_id_text: string, item_soundbite_id_text: string): Promise<void> {
    return this.removeResourceFromPlaylist(playlist_id_text, item_soundbite_id_text, this.itemSoundbiteService, 'item_soundbite_id');
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

    const results = await this._update(
      playlist,
      ['playlist', 'add_by_rss_hash_id'],
      finalDto
    );

    await this.playlistService.updateLastUpdatedAndItemCount(playlist.id_text);

    return results;
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

  async addItemAddByRSSToPlaylistBetween(playlist_id_text: string, add_by_rss_resource_data: object, position1: number, position2: number): Promise<PlaylistResource> {
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

}
