import { StatsAggregatedClip } from '@orm/entities/stats/statsAggregatedClip';
import { StatsTrackEventClipService } from './statsTrackEventClip';
import { BaseStatsAggregatedService, UpdateHistoricalOptions } from './baseStatsAggregated';
import { FindManyOptions } from 'typeorm';
import { getActiveFeedWhere } from '@orm/lib/feedFlagHelpers';
import { SharableStatusEnum } from 'podverse-helpers';

export class StatsAggregatedClipService extends BaseStatsAggregatedService<StatsAggregatedClip, number> {
  private statsTrackEventClipService: StatsTrackEventClipService;

  constructor() {
    super(StatsAggregatedClip);
    this.statsTrackEventClipService = new StatsTrackEventClipService();
  }
  
  protected getIdFieldName(): string {
    return 'clip_id';
  }

  async getMany(config: FindManyOptions<StatsAggregatedClip>): Promise<StatsAggregatedClip[]> {
    return this.repositoryRead.find({
      where: {
        clip: {
          item: {
            ...getActiveFeedWhere()
          }
        }
      },
      ...config
    });
  }

  async getManyAndCountPublic(config: FindManyOptions<StatsAggregatedClip>): Promise<[StatsAggregatedClip[], number]> {
    return this.repositoryRead.findAndCount({
      where: {
        clip: {
          sharable_status_id: SharableStatusEnum.Public,
          item: {
            ...getActiveFeedWhere()
          }
        }
      },
      ...config
    });
  }

  async updateAggregatedStats(clip_id: number, updateAllTime: boolean = false): Promise<void> {
    await this._updateAggregatedStats(clip_id, this.statsTrackEventClipService, updateAllTime);
  }

  async updateAggregatedStatsRolling(clip_id: number, updateHistoricalOptions: UpdateHistoricalOptions): Promise<void> {
    await this._updateAggregatedStatsRolling(clip_id, this.statsTrackEventClipService, updateHistoricalOptions);
  }
}