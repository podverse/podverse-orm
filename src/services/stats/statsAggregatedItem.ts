import { MediumEnum } from 'podverse-helpers';
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

  async getMany(
    config: FindManyOptions<StatsAggregatedItem>,
    medium_id: MediumEnum | null,
    category_id: number | null
  ): Promise<StatsAggregatedItem[]> {
    return this.repositoryRead.find({
      where: {
        item: {
          ...getActiveFeedWhere({
            channel_ids: null,
            medium_id,
            category_id
          })
        }
      },
      ...config
    });
  }

  async getManyByChannels(
    channel_ids: number[],
    medium_id: MediumEnum | null,
    config: FindManyOptions<StatsAggregatedItem>
  ): Promise<StatsAggregatedItem[]> {
    return this.repositoryRead.find({
      where: {
        item: {
          ...getActiveFeedWhere({
            channel_ids,
            medium_id,
            category_id: null
          })
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
