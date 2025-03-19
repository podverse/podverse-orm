import { AppDataSourceReadWrite } from '@orm/db';
import { StatsAggregatedChannel } from '@orm/entities/stats/statsAggregatedChannel';
import { StatsTrackEventChannelService } from './statsTrackEventChannel';
import { BaseStatsAggregatedService, UpdateHistoricalOptions } from './baseStatsAggregated';

export class StatsAggregatedChannelService extends BaseStatsAggregatedService<StatsAggregatedChannel, number> {
  private statsTrackEventChannelService: StatsTrackEventChannelService;

  constructor() {
    super(AppDataSourceReadWrite.getRepository(StatsAggregatedChannel));
    this.statsTrackEventChannelService = new StatsTrackEventChannelService();
  }

  protected getIdFieldName(): string {
    return 'channel_id';
  }

  async updateAggregatedStats(channel_id: number, updateAllTime: boolean = false): Promise<void> {
    await this._updateAggregatedStats(channel_id, this.statsTrackEventChannelService, updateAllTime);
  }

  async updateAggregatedStatsRolling(channel_id: number, updateHistoricalOptions: UpdateHistoricalOptions): Promise<void> {
    await this._updateAggregatedStatsRolling(channel_id, this.statsTrackEventChannelService, updateHistoricalOptions);
  }
}