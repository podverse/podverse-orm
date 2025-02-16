import { EntityManager } from 'typeorm';
import { AccountFollowingPlaylist } from '@orm/entities/account/accountFollowingPlaylist';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { AccountService } from '@orm/services/account/account';

export type AccountFollowingPlaylistDto = {
  playlist_id: number;
};

export class AccountFollowingPlaylistService extends BaseManyService<AccountFollowingPlaylist, 'account'> {
  private accountService: AccountService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(AccountFollowingPlaylist, 'account', transactionalEntityManager);
    this.accountService = new AccountService();
  }

  async followPlaylist(account_id: number, dto: AccountFollowingPlaylistDto): Promise<AccountFollowingPlaylist> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._update(
      account,
      ['account_id', 'playlist_id'],
      dto
    );
  }

  async unfollowPlaylist(account_id: number, dto: AccountFollowingPlaylistDto): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._delete(account, { playlist_id: dto.playlist_id });
  }
}
