import { FindManyOptions, In } from 'typeorm';
import { StatsAggregatedChannel } from '@orm/entities/stats/statsAggregatedChannel';
import { StatsTrackEventChannelService } from './statsTrackEventChannel';
import { BaseStatsAggregatedService, UpdateHistoricalOptions } from './baseStatsAggregated';
import { FeedFlagStatusStatusEnum } from '@orm/entities/feed/feedFlagStatus';

export class StatsAggregatedChannelService extends BaseStatsAggregatedService<StatsAggregatedChannel, number> {
  private statsTrackEventChannelService: StatsTrackEventChannelService;

  constructor() {
    super(StatsAggregatedChannel);
    this.statsTrackEventChannelService = new StatsTrackEventChannelService();
  }

  protected getIdFieldName(): string {
    return 'channel_id';
  }

  async getMany(channel_ids: number[], config: FindManyOptions<StatsAggregatedChannel>): Promise<StatsAggregatedChannel[]> {
    return this.repositoryRead.find({
      where: {
        channel: {
          ...(channel_ids?.length > 0 ? { id: In(channel_ids) } : {}),
          feed: {
            feed_flag_status: In([FeedFlagStatusStatusEnum.Active, FeedFlagStatusStatusEnum.AlwaysParse])
          }
        }
      },
      ...config
    });
  }

  async updateAggregatedStats(channel_id: number, updateAllTime: boolean = false): Promise<void> {
    await this._updateAggregatedStats(channel_id, this.statsTrackEventChannelService, updateAllTime);
  }

  async updateAggregatedStatsRolling(channel_id: number, updateHistoricalOptions: UpdateHistoricalOptions): Promise<void> {
    await this._updateAggregatedStatsRolling(channel_id, this.statsTrackEventChannelService, updateHistoricalOptions);
  }
}