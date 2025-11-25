import { EntityManager } from 'typeorm';
import { Channel } from '@orm/entities/channel/channel';
import { ChannelPodroll } from '@orm/entities/channel/channelPodroll';
import { BaseOneService } from '@orm/services/base/baseOneService';
import { ChannelService } from './channel';
import { ItemService } from '../item/item';
import { ChannelPodrollRemoteItem } from '@orm/entities/channel/channelPodrollRemoteItem';

type ChannelPodrollDto = object

export class ChannelPodrollService extends BaseOneService<ChannelPodroll, 'channel'> {
  constructor(transactionalEntityManager?: EntityManager) {
    super(ChannelPodroll, 'channel', transactionalEntityManager);
  }

  async get(channel: Channel): Promise<ChannelPodroll | null> {
    return super._get(channel);
  }

  async update(channel: Channel, dto: ChannelPodrollDto): Promise<ChannelPodroll> {
    return super._update(channel, dto);
  }

  async delete(channel: Channel): Promise<void> {
    return super._delete(channel);
  }

  async getPodrollChannels(channel_podroll_remote_items: ChannelPodrollRemoteItem[]): Promise<Channel[]> {
    const channelService = new ChannelService();

    const feed_guids = [];

    for (const channel_podroll_remote_item of channel_podroll_remote_items) {
      if (
        channel_podroll_remote_item.feed_guid
        && !channel_podroll_remote_item.item_guid
      ) {
        feed_guids.push(channel_podroll_remote_item.feed_guid);
      }
    }

    const podrollChannels = await channelService.getAllByPodcastGuids(
      {
        relations: [
          'channel_images'
        ]
      },
      feed_guids
    );

    return podrollChannels;
  }

  async getPodrollItems(channel_podroll_remote_items: ChannelPodrollRemoteItem[]) {
    const itemService = new ItemService();

    const params = [];
    for (const channel_podroll_remote_item of channel_podroll_remote_items) {
      if (
        channel_podroll_remote_item.feed_guid
        && channel_podroll_remote_item.item_guid
      ) {
        params.push({
          podcast_guid: channel_podroll_remote_item.feed_guid,
          item_guid: channel_podroll_remote_item.item_guid
        });
      }
    }
    
    const podrollItems = await itemService.getManyByPodcastGuidAndItemGuid(
      params,
      {
        relations: [
          'channel',
          'channel.channel_images',
          'item_images'
        ]
      }
    );

    return podrollItems;
  }

  async getPodrollForChannel(idOrIdText: string) {
    const channelService = new ChannelService();

    const channel = await channelService.getByIdOrIdText(
      idOrIdText,
      { 
        channel_podroll: {
          channel_podroll_remote_items: true
        }
      }
    );

    if (!channel) {
      return {
        podrollChannels: [],
        podrollItems: []
      };
    }

    const channel_podroll_remote_items = channel.channel_podroll?.channel_podroll_remote_items || [];

    if (!channel_podroll_remote_items || channel_podroll_remote_items.length === 0) {
      return {
        podrollChannels: [],
        podrollItems: []
      };
    }

    const podrollChannels = await this.getPodrollChannels(channel_podroll_remote_items);
    const podrollItems = await this.getPodrollItems(channel_podroll_remote_items);

    return {
      podrollChannels,
      podrollItems
    };
  }
}
