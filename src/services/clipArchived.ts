import { calculateExactRangePositions } from 'podverse-helpers';
import { FindOneOptions, Repository } from 'typeorm';
import { ClipService } from './clip';
import { ClipArchived } from '@orm/entities/clipArchived';
import { AppDataSourceRead, AppDataSourceReadWrite } from '@orm/db';
import { PlaylistResourceService } from './playlist/playlistResource';
import { QueueResourceService } from './queue/queueResource';

export class ClipArchivedService {
  protected repositoryRead: Repository<ClipArchived>;
  protected repositoryReadWrite: Repository<ClipArchived>;
  private clipService: ClipService;

  constructor() {
    this.repositoryRead = AppDataSourceRead.getRepository(ClipArchived);
    this.repositoryReadWrite = AppDataSourceReadWrite.getRepository(ClipArchived);
    this.clipService = new ClipService();
  }

  async getByIdTextFull(clip_id_text: string, config?: FindOneOptions<ClipArchived>): Promise<ClipArchived | null> {
    const options: FindOneOptions<ClipArchived> = {
      where: { id_text: clip_id_text },
      ...config
    };

    return this.repositoryRead.findOne(options);
  }

  // This method is only used in PlaylistResource and QueueResource services.
  // If the json columns are selected, the _update method will fail.
  async getByIdText(clip_id_text: string): Promise<ClipArchived | null> {
    const options: FindOneOptions<ClipArchived> = {
      where: { id_text: clip_id_text },
      select: ['id', 'id_text'],
    };

    return this.repositoryRead.findOne(options);
  }

  async archiveClip(clip_id_text: string): Promise<ClipArchived> {
    const clip = await this.clipService.getByIdText(clip_id_text, {
      relations: ['account', 'item', 'item.item_enclosures', 'item.channel', 'item.channel.channel_images', 'sharable_status']
    });

    if (!clip) {
      throw new Error('Clip not found.');
    }

    const clipArchived = new ClipArchived();
    clipArchived.id_text = clip.id_text;
    clipArchived.account = clip.account;
    clipArchived.channel_podcast_index_id = clip.item.channel.podcast_index_id;
    clipArchived.channel_title = clip.item.channel.title;
    clipArchived.channel_images = clip.item.channel.channel_images;
    clipArchived.item_guid = clip.item.guid;
    clipArchived.item_guid_enclosure_url = clip.item.guid_enclosure_url;
    clipArchived.item_alternate_enclosures = clip.item.item_enclosures;
    clipArchived.item_title = clip.item.title;
    clipArchived.item_pub_date = clip.item.pub_date;
    clipArchived.start_time = clip.start_time;
    clipArchived.end_time = clip.end_time;
    clipArchived.title = clip.title;

    clipArchived.description = clip.description;
    clipArchived.sharable_status = clip.sharable_status;

    const savedClipArchived = await this.repositoryReadWrite.save(clipArchived);
    
    const playlistResourceService = new PlaylistResourceService();
    const playlistResourceClips = await playlistResourceService.getResourcesByParams({ clip_id: clip.id });
    for (const playlistResourceClip of playlistResourceClips) {
      const exactRangePositions = calculateExactRangePositions(playlistResourceClip.list_position);
      await playlistResourceService.removeClipFromPlaylist(playlistResourceClip.playlist.id_text, clip.id_text);
      await playlistResourceService.addClipArchivedToPlaylistBetween(playlistResourceClip.playlist.id_text, savedClipArchived.id_text, exactRangePositions.position1, exactRangePositions.position2);
    }
    
    const queueResourceService = new QueueResourceService();
    const queueResourceClips = await queueResourceService.getResourcesByParams({ clip_id: clip.id });
    for (const queueResourceClip of queueResourceClips) {
      const exactRangePositions = calculateExactRangePositions(queueResourceClip.list_position);
      await queueResourceService.removeClipFromQueue(queueResourceClip.queue.id_text, clip.id_text);
      await queueResourceService.addClipArchivedToQueueBetween(queueResourceClip.queue.id_text, savedClipArchived.id_text, exactRangePositions.position1, exactRangePositions.position2);
    }

    await this.clipService.delete(clip.account.id, clip_id_text);
    return savedClipArchived;
  }
}