import { AccountFCMDevice } from '@orm/entities/account/accountFCMDevice';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { AccountService } from '@orm/services/account/account';
import { AccountNotificationChannelService } from '@orm/services/account/accountNotificationChannel';

export class AccountFCMDeviceService extends BaseManyService<AccountFCMDevice, 'account'> {
  private accountService: AccountService;
  private accountNotificationChannelService: AccountNotificationChannelService;

  constructor() {
    super(AccountFCMDevice, 'account');
    this.accountService = new AccountService();
    this.accountNotificationChannelService = new AccountNotificationChannelService();
  }

  async create(account_id: number, fcm_token: string, installation_id: string): Promise<AccountFCMDevice> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const dto: Partial<AccountFCMDevice> = { fcm_token, installation_id };
    return this._update(account, ['fcm_token', 'installation_id'], dto);
  }

  async update(
    account_id: number,
    new_fcm_token: string,
    installation_id: string | null,
    previous_fcm_token: string | null
  ): Promise<AccountFCMDevice> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    // Prefer a match by installation_id + account_id
    if (installation_id) {
      const byInstall = await this.repositoryRead.findOne({ where: { account_id, installation_id } });
      if (byInstall) {
        const dto: Partial<AccountFCMDevice> = { account, fcm_token: new_fcm_token };
        return this._update(account, ['fcm_token'], dto, undefined, byInstall);
      }
    }

    // Fallback: match by previous_fcm_token + account_id
    if (previous_fcm_token) {
      const byToken = await this.repositoryRead.findOne({ where: { account_id, fcm_token: previous_fcm_token } });
      if (byToken) {
        const dto: Partial<AccountFCMDevice> = { account, fcm_token: new_fcm_token };
        if (installation_id) dto.installation_id = installation_id;
        return this._update(account, ['fcm_token', 'installation_id'], dto, undefined, byToken);
      }
    }

    throw new Error("FCM Device not found for update.");
  }

  async delete(account_id: number, fcm_token?: string, installation_id?: string): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    if (installation_id) {
      const byInstall = await this.repositoryRead.findOne({ where: { account_id, installation_id } });
      if (byInstall) {
        return this._delete(account, { installation_id });
      }
    }

    if (fcm_token) {
      const byToken = await this.repositoryRead.findOne({ where: { account_id, fcm_token } });
      if (byToken) {
        return this._delete(account, { fcm_token });
      }
    }

    throw new Error("FCM Device not found for deletion.");
  }

  async getFCMTokensByChannelIdText(channel_id_text: string): Promise<string[]> {
    const notificationChannels = await this.accountNotificationChannelService.getAllByChannelIdText(channel_id_text);
    const fcmTokens: string[] = [];

    for (const notificationChannel of notificationChannels) {
      const accountFCMDevices = await this.repositoryRead.find({ where: { account_id: notificationChannel.account_id } });
      for (const device of accountFCMDevices) {
        fcmTokens.push(device.fcm_token);
      }
    }

    return fcmTokens;
  }

  async getAllForAccount(account_id: number): Promise<AccountFCMDevice[]> {
    return this.repositoryRead.find({ where: { account_id } });
  }
  


}