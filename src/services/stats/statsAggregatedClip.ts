import { MediumEnum, SharableStatusEnum } from 'podverse-helpers';
import { StatsAggregatedClip } from '@orm/entities/stats/statsAggregatedClip';
import { StatsTrackEventClipService } from './statsTrackEventClip';
import { BaseStatsAggregatedService, UpdateHistoricalOptions } from './baseStatsAggregated';
import { FindManyOptions } from 'typeorm';
import { getActiveFeedWhere } from '@orm/lib/feedFlagHelpers';

export class StatsAggregatedClipService extends BaseStatsAggregatedService<StatsAggregatedClip, number> {
  private statsTrackEventClipService: StatsTrackEventClipService;

  constructor() {
    super(StatsAggregatedClip);
    this.statsTrackEventClipService = new StatsTrackEventClipService();
  }
  
  protected getIdFieldName(): string {
    return 'clip_id';
  }

  async getMany(
    config: FindManyOptions<StatsAggregatedClip>,
    medium_id: MediumEnum | null
  ): Promise<StatsAggregatedClip[]> {
    return this.repositoryRead.find({
      where: {
        clip: {
          item: {
            ...getActiveFeedWhere({
              channel_ids: null,
              medium_id
            })
          }
        }
      },
      ...config
    });
  }

  async getManyAndCountPublic(
    config: FindManyOptions<StatsAggregatedClip>,
    medium_id: MediumEnum | null
  ): Promise<[StatsAggregatedClip[], number]> {
    return this.repositoryRead.findAndCount({
      where: {
        clip: {
          sharable_status_id: SharableStatusEnum.Public,
          item: {
            ...getActiveFeedWhere({
              channel_ids: null,
              medium_id
            })
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
