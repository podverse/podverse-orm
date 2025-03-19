import { AppDataSourceReadWrite } from '@orm/db';
import { StatsAggregatedAccount } from '@orm/entities/stats/statsAggregatedAccount';
import { StatsTrackEventAccountService } from './statsTrackEventAccount';
import { BaseStatsAggregatedService, UpdateHistoricalOptions } from './baseStatsAggregated';

export class StatsAggregatedAccountService extends BaseStatsAggregatedService<StatsAggregatedAccount, number> {
  private statsTrackEventAccountService: StatsTrackEventAccountService;

  constructor() {
    super(AppDataSourceReadWrite.getRepository(StatsAggregatedAccount));
    this.statsTrackEventAccountService = new StatsTrackEventAccountService();
  }

  protected getIdFieldName(): string {
    return 'tracked_account_id';
  }

  async updateAggregatedStats(account_id: number, updateAllTime: boolean = false): Promise<void> {
    await this._updateAggregatedStats(account_id, this.statsTrackEventAccountService, updateAllTime);
  }

  async updateAggregatedStatsRolling(account_id: number, updateHistoricalOptions: UpdateHistoricalOptions): Promise<void> {
    await this._updateAggregatedStatsRolling(account_id, this.statsTrackEventAccountService, updateHistoricalOptions);
  }
}