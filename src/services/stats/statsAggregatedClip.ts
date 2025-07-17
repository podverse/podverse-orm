import { StatsAggregatedClip } from '@orm/entities/stats/statsAggregatedClip';
import { StatsTrackEventClipService } from './statsTrackEventClip';
import { BaseStatsAggregatedService, UpdateHistoricalOptions } from './baseStatsAggregated';

export class StatsAggregatedClipService extends BaseStatsAggregatedService<StatsAggregatedClip, number> {
  private statsTrackEventClipService: StatsTrackEventClipService;

  constructor() {
    super(StatsAggregatedClip);
    this.statsTrackEventClipService = new StatsTrackEventClipService();
  }
  
  protected getIdFieldName(): string {
    return 'clip_id';
  }

  async updateAggregatedStats(clip_id: number, updateAllTime: boolean = false): Promise<void> {
    await this._updateAggregatedStats(clip_id, this.statsTrackEventClipService, updateAllTime);
  }

  async updateAggregatedStatsRolling(clip_id: number, updateHistoricalOptions: UpdateHistoricalOptions): Promise<void> {
    await this._updateAggregatedStatsRolling(clip_id, this.statsTrackEventClipService, updateHistoricalOptions);
  }
}