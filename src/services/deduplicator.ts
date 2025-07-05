import { EntityManager } from 'typeorm';
import { AppDataSourceReadWrite } from '@orm/db';
import { AccountFollowingChannel } from '@orm/entities/account/accountFollowingChannel';
import { Clip } from '@orm/entities/clip';
import { Item } from '@orm/entities/item/item';
import { PlaylistResource } from '@orm/entities/playlist/playlistResource';

export class DeduplicatorService {
  protected readWriteEntityManager: EntityManager;
  
  constructor() {
    this.readWriteEntityManager = AppDataSourceReadWrite.manager;
  }

  async mergeChannels(id_to_remove: number, duplicate_id_to_keep: number): Promise<void> {    
    await this.updateAccountFollowingChannel(id_to_remove, duplicate_id_to_keep);

    const { itemsToRemove, duplicateItemsToKeep } = await this.getItemsForBothChannels(id_to_remove, duplicate_id_to_keep);
    const { guidMap, guidEnclosureUrlMap } = this.buildItemMaps(duplicateItemsToKeep);

    for (const itemToRemove of itemsToRemove) {
      const duplicateItemToKeep = this.findDuplicateItem(itemToRemove, guidMap, guidEnclosureUrlMap);
      if (duplicateItemToKeep) {
        await this.updateClipAndPlaylistResource(itemToRemove.id, duplicateItemToKeep.id);
      }
    }
  }

  private async updateAccountFollowingChannel(id_to_remove: number, duplicate_id_to_keep: number): Promise<void> {
    await this.readWriteEntityManager
      .createQueryBuilder()
      .update(AccountFollowingChannel)
      .set({ channel_id: duplicate_id_to_keep })
      .where("channel_id = :channel_to_remove", { channel_to_remove: id_to_remove })
      .execute();
  }

  private buildItemMaps(items: Item[]): { guidMap: Map<string, Item>, guidEnclosureUrlMap: Map<string, Item> } {
    const guidMap = new Map<string, Item>();
    const guidEnclosureUrlMap = new Map<string, Item>();
    for (const item of items) {
      if (item.guid) guidMap.set(item.guid, item);
      if (item.guid_enclosure_url) guidEnclosureUrlMap.set(item.guid_enclosure_url, item);
    }
    return { guidMap, guidEnclosureUrlMap };
  }

  private findDuplicateItem(
    itemToRemove: Item,
    guidMap: Map<string, Item>,
    guidEnclosureUrlMap: Map<string, Item>
  ): Item | undefined {
    if (itemToRemove.guid && guidMap.has(itemToRemove.guid)) {
      return guidMap.get(itemToRemove.guid);
    }
    if (itemToRemove.guid_enclosure_url && guidEnclosureUrlMap.has(itemToRemove.guid_enclosure_url)) {
      return guidEnclosureUrlMap.get(itemToRemove.guid_enclosure_url);
    }
    return undefined;
  }

  private async updateClipAndPlaylistResource(itemToRemoveId: number, duplicateItemToKeepId: number): Promise<void> {
    await this.readWriteEntityManager
      .createQueryBuilder()
      .update(Clip)
      .set({ item_id: duplicateItemToKeepId })
      .where("item_id = :itemToRemoveId", { itemToRemoveId })
      .execute();

    await this.readWriteEntityManager
      .createQueryBuilder()
      .update(PlaylistResource)
      .set({ item_id: duplicateItemToKeepId })
      .where("item_id = :itemToRemoveId", { itemToRemoveId })
      .execute();
  }

  async getChannelItems(channel_id: number): Promise<Item[]> {
    const items = await this.readWriteEntityManager
      .getRepository(Item)
      .find({ where: { channel: { id: channel_id } } });
    return items;
  }

  async getItemsForBothChannels(id_to_remove: number, duplicate_id_to_keep: number): Promise<{ itemsToRemove: Item[], duplicateItemsToKeep: Item[] }> {
    const itemsToRemove = await this.getChannelItems(id_to_remove);
    const duplicateItemsToKeep = await this.getChannelItems(duplicate_id_to_keep);
    return { itemsToRemove, duplicateItemsToKeep };
  }
}