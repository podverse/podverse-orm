import { AppDataSourceReadWrite } from '@orm/db';
import { StatsAggregatedItem } from '@orm/entities/stats/statsAggregatedItem';
import { StatsTrackEventItemService } from './statsTrackEventItem';
import { BaseStatsAggregatedService, UpdateHistoricalOptions } from './baseStatsAggregated';

export class StatsAggregatedItemService extends BaseStatsAggregatedService<StatsAggregatedItem, number> {
  private statsTrackEventItemService: StatsTrackEventItemService;

  constructor() {
    super(AppDataSourceReadWrite.getRepository(StatsAggregatedItem));
    this.statsTrackEventItemService = new StatsTrackEventItemService();
  }

  protected getIdFieldName(): string {
    return 'item_id';
  }

  async updateAggregatedStats(item_id: number, updateAllTime: boolean = false): Promise<void> {
    await this._updateAggregatedStats(item_id, this.statsTrackEventItemService, updateAllTime);
  }

  async updateAggregatedStatsRolling(item_id: number, updateHistoricalOptions: UpdateHistoricalOptions): Promise<void> {
    await this._updateAggregatedStatsRolling(item_id, this.statsTrackEventItemService, updateHistoricalOptions);
  }
}