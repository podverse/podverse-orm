import { MediumEnum, SharableStatusEnum } from 'podverse-helpers';
import { FindManyOptions, In } from 'typeorm';
import { StatsAggregatedPlaylist } from '@orm/entities/stats/statsAggregatedPlaylist';
import { StatsTrackEventPlaylistService } from './statsTrackEventPlaylist';
import { BaseStatsAggregatedService, STATS_AGGREGATED_SELECT_ALL, UpdateHistoricalOptions } from './baseStatsAggregated';

export class StatsAggregatedPlaylistService extends BaseStatsAggregatedService<StatsAggregatedPlaylist, number> {
  private statsTrackEventPlaylistService: StatsTrackEventPlaylistService;

  constructor() {
    super(StatsAggregatedPlaylist);
    this.statsTrackEventPlaylistService = new StatsTrackEventPlaylistService();
  }

  protected getIdFieldName(): string {
    return 'playlist_id';
  }

  async getMany(config: FindManyOptions<StatsAggregatedPlaylist>): Promise<StatsAggregatedPlaylist[]> {
    return this.repositoryRead.find(config);
  }

  async getManyCount(config: FindManyOptions<StatsAggregatedPlaylist>): Promise<number> {
    return this.repositoryRead.count(config);
  }

  async getManyPublic(
    config: FindManyOptions<StatsAggregatedPlaylist>,
    medium_id?: MediumEnum
  ): Promise<StatsAggregatedPlaylist[]> {
    return this.repositoryRead.find({
      ...config,
      select: {
        ...STATS_AGGREGATED_SELECT_ALL,
        playlist: {
          id_text: true,
          title: true,
          description: true,
          is_default_favorites: true,
          item_count: true,
          account: {
            id_text: true,
            account_profile: {
              display_name: true
            }
          }
        }
      },
      where: {
        playlist: {
          sharable_status_id: SharableStatusEnum.Public,
          ...(medium_id ? { medium_id } : {})
        }
      },
      relations: [
        'playlist',
        'playlist.account',
        'playlist.account.account_profile',
        'playlist.sharable_status',
        'playlist.medium'
      ]
    });
  }

  async getManyPrivate(
    config: FindManyOptions<StatsAggregatedPlaylist>,
    account_id: number,
    medium_id?: MediumEnum,
  ): Promise<[StatsAggregatedPlaylist[], number]> {
    return this.repositoryRead.findAndCount({
      ...config,
      select: {
        ...STATS_AGGREGATED_SELECT_ALL,
        playlist: {
          id_text: true,
          title: true,
          description: true,
          is_default_favorites: true,
          item_count: true,
          account: {
            id_text: true,
            account_profile: {
              display_name: true
            }
          }
        }
      },
      where: {
        playlist: {
          ...(medium_id ? { medium_id } : {}),
          ...(account_id ? { account: { id: account_id } } : {})
        }
      },
      relations: [
        'playlist',
        'playlist.account',
        'playlist.account.account_profile',
        'playlist.sharable_status',
        'playlist.medium'
      ]
    });
  }

  async getManyByPlaylists(playlist_id_texts: string[], config: FindManyOptions<StatsAggregatedPlaylist>): Promise<StatsAggregatedPlaylist[]> {
    return this.repositoryRead.find({
      ...config,
      where: {
        ...config.where,
        playlist: {
          id_text: In(playlist_id_texts)
        }
      }
    });
  }

  async getManyByPlaylistsCount(playlist_id_texts: string[], config: FindManyOptions<StatsAggregatedPlaylist>): Promise<number> {
    return this.repositoryRead.count({
      ...config,
      where: {
        ...config.where,
        playlist: {
          id_text: In(playlist_id_texts)
        }
      }
    });
  }

  async updateAggregatedStats(playlist_id: number, updateAllTime: boolean = false): Promise<void> {
    await this._updateAggregatedStats(playlist_id, this.statsTrackEventPlaylistService, updateAllTime);
  }

  async updateAggregatedStatsRolling(playlist_id: number, updateHistoricalOptions: UpdateHistoricalOptions): Promise<void> {
    await this._updateAggregatedStatsRolling(playlist_id, this.statsTrackEventPlaylistService, updateHistoricalOptions);
  }
}
