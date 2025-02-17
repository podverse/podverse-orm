import { MediumEnum, SharableStatusEnum } from 'podverse-helpers';
import { EntityManager } from 'typeorm';
import { Playlist } from '@orm/entities/playlist/playlist';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { AccountService } from '@orm/services/account/account';

export type PlaylistDto = {
  title?: string;
  description?: string;
  medium: MediumEnum;
  sharable_status: SharableStatusEnum;
  is_default_favorites: boolean;
};

export class PlaylistService extends BaseManyService<Playlist, 'account'> {
  private accountService: AccountService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(Playlist, 'account', transactionalEntityManager);
    this.accountService = new AccountService();
  }

  async createPlaylist(account_id: number, dto: PlaylistDto): Promise<Playlist> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const whereKeys = [] as (keyof Playlist)[];
    return this._update(account, whereKeys, dto);
  }

  async updatePlaylist(account_id: number, playlist_id_text: string, dto: PlaylistDto): Promise<Playlist> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const playlist = await this._get(account, { id_text: playlist_id_text });
    if (!playlist) {
      throw new Error("Playlist not found.");
    }

    const whereKeys = ['id'] as (keyof Playlist)[];
    return this._update(account, whereKeys, dto, undefined, playlist);
  }

  async deletePlaylist(account_id: number, playlist_id_text: string): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._delete(account, { id_text: playlist_id_text });
  }

  async getPlaylists(account_id: number): Promise<Playlist[]> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._getAll(account);
  }
}
