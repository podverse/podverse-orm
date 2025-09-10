import { FindManyOptions } from 'typeorm';
import { StatsAggregatedChannel } from '@orm/entities/stats/statsAggregatedChannel';
import { StatsTrackEventChannelService } from './statsTrackEventChannel';
import { BaseStatsAggregatedService, UpdateHistoricalOptions } from './baseStatsAggregated';
import { getActiveFeedWhere } from '@orm/lib/feedFlagHelpers';

export class StatsAggregatedChannelService extends BaseStatsAggregatedService<StatsAggregatedChannel, number> {
  private statsTrackEventChannelService: StatsTrackEventChannelService;

  constructor() {
    super(StatsAggregatedChannel);
    this.statsTrackEventChannelService = new StatsTrackEventChannelService();
  }

  protected getIdFieldName(): string {
    return 'channel_id';
  }

  private mergeWhere(feedWhere: object | undefined, configWhere: object | undefined) {
    return { ...(feedWhere || {}), ...(configWhere || {}) };
  }

  async getMany(config: FindManyOptions<StatsAggregatedChannel>): Promise<StatsAggregatedChannel[]> {
    const feedWhere = getActiveFeedWhere();
    return this.repositoryRead.find({
      ...config,
      where: this.mergeWhere(feedWhere, config.where)
    });
  }

  async getManyCount(config: FindManyOptions<StatsAggregatedChannel>): Promise<number> {
    const feedWhere = getActiveFeedWhere();
    return this.repositoryRead.count({
      ...config,
      where: this.mergeWhere(feedWhere, config.where)
    });
  }

  async getManyByChannels(channel_ids: number[], config: FindManyOptions<StatsAggregatedChannel>): Promise<StatsAggregatedChannel[]> {
    const feedWhere = getActiveFeedWhere(channel_ids);
    return this.repositoryRead.find({
      ...config,
      where: this.mergeWhere(feedWhere, config.where)
    });
  }

  async getManyByChannelsCount(channel_ids: number[], config: FindManyOptions<StatsAggregatedChannel>): Promise<number> {
    const feedWhere = getActiveFeedWhere(channel_ids);
    return this.repositoryRead.count({
      ...config,
      where: this.mergeWhere(feedWhere, config.where)
    });
  }

  async updateAggregatedStats(channel_id: number, updateAllTime: boolean = false): Promise<void> {
    await this._updateAggregatedStats(channel_id, this.statsTrackEventChannelService, updateAllTime);
  }

  async updateAggregatedStatsRolling(channel_id: number, updateHistoricalOptions: UpdateHistoricalOptions): Promise<void> {
    await this._updateAggregatedStatsRolling(channel_id, this.statsTrackEventChannelService, updateHistoricalOptions);
  }
}
