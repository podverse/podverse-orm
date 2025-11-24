import { MediumEnum } from 'podverse-helpers';
import { EntityManager, Equal, FindManyOptions } from 'typeorm';
import { AccountFollowingChannel } from '@orm/entities/account/accountFollowingChannel';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { AccountService } from '@orm/services/account/account';
import { ChannelService } from '../channel/channel';

export class AccountFollowingChannelService extends BaseManyService<AccountFollowingChannel, 'account'> {
  private accountService: AccountService;
  private channelService: ChannelService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(AccountFollowingChannel, 'account', transactionalEntityManager);
    this.accountService = new AccountService();
    this.channelService = new ChannelService();
  }

  async getFollowedChannels(account_id: number, medium_id: MediumEnum | null,
    config?: FindManyOptions<AccountFollowingChannel>): Promise<AccountFollowingChannel[]> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const finalConfig = {
      ...config,
      ...(medium_id ? {
        where: {
          ...config?.where,
          channel: {
            medium_id: Equal(medium_id)
          }
        }
      } : {})
    };

    return this._getAll(account, finalConfig);
  }

  async getFollowedChannelsWithCount(account_id: number, medium_id: MediumEnum | null,
    config?: FindManyOptions<AccountFollowingChannel>): Promise<{
      count: number; results: AccountFollowingChannel[] }> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const finalConfig = {
      ...config,
      ...(medium_id ? {
        where: {
          ...config?.where,
          channel: {
            medium_id: Equal(medium_id)
          }
        }
      } : {})
    };

    return this._getAllWithCount(account, finalConfig);
  }

  async followChannel(account_id: number, channel_id_text: string): Promise<AccountFollowingChannel> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const channel = await this.channelService.getByIdText(channel_id_text);
    if (!channel) {
      throw new Error("Channel not found.");
    }

    const dto = { channel_id: channel.id };

    return this._update(
      account,
      ['account_id', 'channel_id'],
      dto
    );
  }

  async unfollowChannel(account_id: number, channel_id_text: string): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const channel = await this.channelService.getByIdText(channel_id_text);
    if (!channel) {
      throw new Error("Channel not found.");
    }

    return this._delete(account, { channel_id: channel.id });
  }
}