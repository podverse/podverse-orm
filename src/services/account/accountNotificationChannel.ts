import { EntityManager, FindManyOptions, FindOneOptions } from 'typeorm';
import { AccountNotificationChannel } from '@orm/entities/account/accountNotificationChannel';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { AccountService } from '@orm/services/account/account';
import { ChannelService } from '@orm/services/channel/channel';

export class AccountNotificationChannelService extends BaseManyService<AccountNotificationChannel, 'account'> {
  private accountService: AccountService;
  private channelService: ChannelService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(AccountNotificationChannel, 'account', transactionalEntityManager);
    this.accountService = new AccountService();
    this.channelService = new ChannelService();
  }

  async getByAccountIdAndChannelIdText(account_id: number, channel_id_text: string, config?: FindOneOptions<AccountNotificationChannel>): Promise<AccountNotificationChannel | null> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const channel = await this.channelService.getByIdText(channel_id_text);
    if (!channel) {
      throw new Error("Channel not found.");
    }

    return this._get(account, { channel_id: channel.id }, config);
  }

  async getAllByAccountId(account_id: number, config?: FindManyOptions<AccountNotificationChannel>): Promise<AccountNotificationChannel[]> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._getAll(account, config);
  }

  async getAllByChannelIdText(channel_id_text: string, config?: FindManyOptions<AccountNotificationChannel>): Promise<AccountNotificationChannel[]> {
    const channel = await this.channelService.getByIdText(channel_id_text);
    if (!channel) {
      throw new Error("Channel not found.");
    }

    return this.repositoryRead.find({ where: { channel_id: channel.id }, ...config });
  }

  async create(account_id: number, channel_id_text: string): Promise<AccountNotificationChannel> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const channel = await this.channelService.getByIdText(channel_id_text);
    if (!channel) {
      throw new Error("Channel not found.");
    }

    const dto = { account_id, channel_id: channel.id };
    return this._update(account, ['account_id', 'channel_id'], dto);
  }

  async delete(account_id: number, channel_id_text: string): Promise<void> {
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