import { FindManyOptions } from 'typeorm';
import { Channel } from '@orm/entities/channel/channel';
import { Item } from '@orm/entities/item/item';
import { LiveItem } from '@orm/entities/liveItem/liveItem';
import { LiveItemStatusEnum } from '@orm/entities/liveItem/liveItemStatus';
import { BaseOneService } from '@orm/services/base/baseOneService';

type LiveItemDto = {
  live_item_status: LiveItemStatusEnum
  start_time: Date
  end_time: Date | null
}

export class LiveItemService extends BaseOneService<LiveItem, 'item'> {
  constructor() {
    super(LiveItem, 'item');
  }

  async update(item: Item, dto: LiveItemDto): Promise<LiveItem> {
    console.log('LiveItemService.update called with item.id:', item.id);
    console.log('LiveItemService.update called with dto:', dto);
    const finalDto = {
      start_time: dto.start_time,
      end_time: dto.end_time,
      live_item_status_id: dto.live_item_status
    };
    console.log('LiveItemService.update finalDto:', finalDto);
    return super._update(item, finalDto, { relations: ['live_item_status'] });
  }

  async getManyByChannel(channel: Channel, config?: FindManyOptions<LiveItem>): Promise<LiveItem[]> {
    return this.repositoryRead.find({
      where: { item: { channel } },
      ...config
    });
  }
}
