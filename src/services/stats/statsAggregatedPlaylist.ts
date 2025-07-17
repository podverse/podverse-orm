import { StatsAggregatedPlaylist } from '@orm/entities/stats/statsAggregatedPlaylist';
import { StatsTrackEventPlaylistService } from './statsTrackEventPlaylist';
import { BaseStatsAggregatedService, UpdateHistoricalOptions } from './baseStatsAggregated';

export class StatsAggregatedPlaylistService extends BaseStatsAggregatedService<StatsAggregatedPlaylist, number> {
  private statsTrackEventPlaylistService: StatsTrackEventPlaylistService;

  constructor() {
    super(StatsAggregatedPlaylist);
    this.statsTrackEventPlaylistService = new StatsTrackEventPlaylistService();
  }

  protected getIdFieldName(): string {
    return 'playlist_id';
  }

  async updateAggregatedStats(playlist_id: number, updateAllTime: boolean = false): Promise<void> {
    await this._updateAggregatedStats(playlist_id, this.statsTrackEventPlaylistService, updateAllTime);
  }

  async updateAggregatedStatsRolling(playlist_id: number, updateHistoricalOptions: UpdateHistoricalOptions): Promise<void> {
    await this._updateAggregatedStatsRolling(playlist_id, this.statsTrackEventPlaylistService, updateHistoricalOptions);
  }
}