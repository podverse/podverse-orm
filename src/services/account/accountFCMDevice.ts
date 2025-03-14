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

  async create(account_id: number, fcm_token: string): Promise<AccountFCMDevice> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    const dto = { fcm_token };
    return this._update(account, ['fcm_token'], dto);
  }

  async update(account_id: number, previous_fcm_token: string, new_fcm_token: string): Promise<AccountFCMDevice> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }
  
    const existingDevice = await this.repositoryRead.findOne({ where: { account_id, fcm_token: previous_fcm_token } });
    if (!existingDevice) {
      throw new Error("FCM device not found.");
    }
  
    const dto = { account, fcm_token: new_fcm_token };
    return this._update(account, ['fcm_token'], dto, undefined, existingDevice);
  }

  async delete(account_id: number, fcm_token: string): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    return this._delete(account, { fcm_token });
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
}