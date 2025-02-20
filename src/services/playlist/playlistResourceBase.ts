import { EntityManager, FindOptionsOrderValue } from 'typeorm';
import { PlaylistResourceBase } from '@orm/entities/playlist/playlistResourceBase';
import { PlaylistService } from './playlist';
import { BaseManyService } from '@orm/services/base/baseManyService';

export class PlaylistResourceBaseService extends BaseManyService<PlaylistResourceBase, 'playlist'> {
  private playlistService: PlaylistService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(PlaylistResourceBase, 'playlist', transactionalEntityManager);
    this.playlistService = new PlaylistService(transactionalEntityManager);
  }

  async getAllByPlaylistIdText(playlist_id_text: string): Promise<PlaylistResourceBase[]> {
    const playlist = await this.playlistService.getByIdText(playlist_id_text);
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const options = {
      where: { playlist: { id: playlist.id } },
      order: { list_position: 'ASC' as FindOptionsOrderValue }
    };

    return this.repositoryRead.find(options);
  }
}
