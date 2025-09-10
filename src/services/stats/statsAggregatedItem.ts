import { StatsAggregatedItem } from '@orm/entities/stats/statsAggregatedItem';
import { StatsTrackEventItemService } from './statsTrackEventItem';
import { BaseStatsAggregatedService, UpdateHistoricalOptions } from './baseStatsAggregated';
import { FindManyOptions } from 'typeorm';
import { getActiveFeedWhere } from '@orm/lib/feedFlagHelpers';

export class StatsAggregatedItemService extends BaseStatsAggregatedService<StatsAggregatedItem, number> {
  private statsTrackEventItemService: StatsTrackEventItemService;

  constructor() {
    super(StatsAggregatedItem);
    this.statsTrackEventItemService = new StatsTrackEventItemService();
  }

  protected getIdFieldName(): string {
    return 'item_id';
  }

  async getMany(config: FindManyOptions<StatsAggregatedItem>): Promise<StatsAggregatedItem[]> {
    return this.repositoryRead.find({
      where: {
        item: {
          ...getActiveFeedWhere()
        }
      },
      ...config
    });
  }

  async getManyByChannels(channel_ids: number[], config: FindManyOptions<StatsAggregatedItem>): Promise<StatsAggregatedItem[]> {
    return this.repositoryRead.find({
      where: {
        item: {
          ...getActiveFeedWhere(channel_ids)
        }
      },
      ...config
    });
  }

  async updateAggregatedStats(item_id: number, updateAllTime: boolean = false): Promise<void> {
    await this._updateAggregatedStats(item_id, this.statsTrackEventItemService, updateAllTime);
  }

  async updateAggregatedStatsRolling(item_id: number, updateHistoricalOptions: UpdateHistoricalOptions): Promise<void> {
    await this._updateAggregatedStatsRolling(item_id, this.statsTrackEventItemService, updateHistoricalOptions);
  }
}
