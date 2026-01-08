import { CreateAccountUPDeviceParams, UpdateAccountUPDeviceParams, DeleteAccountUPDeviceParams } from 'podverse-helpers';
import { In } from 'typeorm';
import { AccountUPDevice } from '@orm/entities/account/accountUPDevice';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { AccountService } from '@orm/services/account/account';
import { AccountNotificationChannelService } from '@orm/services/account/accountNotificationChannel';
import { config } from '@orm/config';

export class AccountUPDeviceService extends BaseManyService<AccountUPDevice, 'account'> {
  private accountService: AccountService;
  private accountNotificationChannelService: AccountNotificationChannelService;

  constructor() {
    super(AccountUPDevice, 'account');
    this.accountService = new AccountService();
    this.accountNotificationChannelService = new AccountNotificationChannelService();
  }

  async create(account_id: number, params: CreateAccountUPDeviceParams): Promise<AccountUPDevice> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error('Account not found.');
    }
    const { up_endpoint, up_auth_key } = params;

    const locale = account.account_settings?.account_settings_locale?.locale || config.defaults.account.settings.locale;

    const dto: Partial<AccountUPDevice> = { up_endpoint, up_auth_key: up_auth_key, locale };
    return this._update(account, ['up_endpoint', 'up_auth_key', 'locale'], dto);
  }

  async update(
    account_id: number,
    params: UpdateAccountUPDeviceParams
  ): Promise<AccountUPDevice> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error('Account not found.');
    }
    const { up_endpoint, up_auth_key } = params;

    const locale = account.account_settings?.account_settings_locale?.locale || config.defaults.account.settings.locale;

    // Match by up_endpoint + account_id
    const existing = await this.repositoryRead.findOne({ where: { account_id, up_endpoint } });
    if (existing) {
      const dto: Partial<AccountUPDevice> = { account, up_endpoint, up_auth_key, locale };
      return this._update(account, ['up_endpoint', 'up_auth_key', 'locale'], dto, undefined, existing);
    }

    throw new Error('UP Device not found for update.');
  }

  async delete(account_id: number, params: DeleteAccountUPDeviceParams): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error('Account not found.');
    }
    const { up_endpoint } = params;

    const existing = await this.repositoryRead.findOne({ where: { account_id, up_endpoint } });
    if (existing) {
      return this._delete(account, { up_endpoint });
    }

    throw new Error('UP Device not found for deletion.');
  }

  async getUPSubscriptionsByChannelIdText(channel_id_text: string): Promise<Array<{
    up_endpoint: string;
    up_auth_key: string | null;
    locale: string;
  }>> {
    const notificationChannels = await this.accountNotificationChannelService.getAllByChannelIdText(channel_id_text);
    const subscriptions: Array<{ up_endpoint: string; up_auth_key: string | null; locale: string }> = [];

    for (const notificationChannel of notificationChannels) {
      const upDevices = await this.repositoryRead.find({ where: { account_id: notificationChannel.account_id } });
      for (const device of upDevices) {
        subscriptions.push({
          up_endpoint: device.up_endpoint,
          up_auth_key: device.up_auth_key,
          locale: device.locale
        });
      }
    }

    return subscriptions;
  }

  async getAllForAccount(account_id: number): Promise<AccountUPDevice[]> {
    return this.repositoryRead.find({ where: { account_id } });
  }

  async getAllForAccountIds(account_ids: number[]): Promise<AccountUPDevice[]> {
    if (account_ids.length === 0) return [];
    return this.repositoryRead.find({ where: { account_id: In(account_ids) } });
  }

  async updateLocaleForAccount(account_id: number, params: { locale: string }): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error('Account not found.');
    }

    const { locale } = params;

    await this.repositoryRead.createQueryBuilder()
      .update(AccountUPDevice)
      .set({ locale })
      .where('account_id = :account_id', { account_id })
      .execute();
  }

  async deleteAllForAccount(account_id: number): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error('Account not found.');
    }

    await this.repositoryRead.createQueryBuilder()
      .delete()
      .from(AccountUPDevice)
      .where('account_id = :account_id', { account_id })
      .execute();
  }
}
