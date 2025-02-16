import { EntityManager } from 'typeorm';
import { AccountFollowingChannel } from '@orm/entities/account/accountFollowingChannel';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { AccountService } from '@orm/services/account/account';

export type AccountFollowingChannelDto = {
  channel_id: number;
};

export class AccountFollowingChannelService extends BaseManyService<AccountFollowingChannel, 'account'> {
  private accountService: AccountService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(AccountFollowingChannel, 'account', transactionalEntityManager);
    this.accountService = new AccountService();
  }

  async followChannel(account_id: number, dto: AccountFollowingChannelDto): Promise<AccountFollowingChannel> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._update(
      account,
      ['account_id', 'channel_id'],
      dto
    );
  }

  async unfollowChannel(account_id: number, dto: AccountFollowingChannelDto): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._delete(account, { channel_id: dto.channel_id });
  }
}
