import { MediumEnum } from 'podverse-helpers';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Channel } from '@orm/entities/channel/channel';
import { Feed } from '@orm/entities/feed/feed';
import { applyProperties } from '@orm/lib/applyProperties';
import { AppDataSourceRead, AppDataSourceReadWrite } from '@orm/db';

type ChannelInitializeDto = {
  feed: Feed,
  podcast_index_id: number
}

type ChannelDto = {
  slug?: string | null
  podcast_guid?: string | null
  title: string | null
  sortable_title: string | null
  medium?: MediumEnum | null
  has_podcast_index_value?: boolean
  has_value_time_splits?: boolean
  hidden?: boolean
  marked_for_deletion?: boolean
}

export class ChannelService {
  protected repositoryRead: Repository<Channel>;
  protected repositoryReadWrite: Repository<Channel>;

  constructor() {
    this.repositoryRead = AppDataSourceRead.getRepository(Channel);
    this.repositoryReadWrite = AppDataSourceReadWrite.getRepository(Channel);
  }

  async get(id: number, config?: FindOneOptions<Channel>): Promise<Channel | null> {
    return this.repositoryRead.findOne({ where: { id }, ...config });
  }

  async _getByIdText(id_text: string, config?: FindOneOptions<Channel>): Promise<Channel | null> {
    return this.repositoryRead.findOne({ where: { id_text }, ...config });
  }

  async getByPodcastIndexId(podcast_index_id: number, config?: FindOneOptions<Channel>): Promise<Channel | null> {
    return this.repositoryRead.findOne({ where: { podcast_index_id }, ...config });
  }

  async getMany(config: FindManyOptions<Channel>): Promise<Channel[]> {
    return this.repositoryRead.find(config);
  }

  async getOrCreateByPodcastIndexId(dto: ChannelInitializeDto): Promise<Channel> {
    let channel = await this.getByPodcastIndexId(dto.podcast_index_id);

    if (!channel) {
      channel = new Channel();
      channel.feed_id = dto.feed.id;
      channel.podcast_index_id = dto.podcast_index_id;
      channel = await this.repositoryReadWrite.save(channel);
    }

    return channel;
  }

  async update(id: number, dto: ChannelDto): Promise<Channel> {
    let channel = await this.get(id);

    if (!channel) {
      channel = new Channel();
    }

    channel = applyProperties(channel, dto);

    return this.repositoryReadWrite.save(channel);
  }
}
