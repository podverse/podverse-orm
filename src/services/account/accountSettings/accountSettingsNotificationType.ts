import { AccountNotificationTypeValues } from 'podverse-helpers';
import { Repository } from 'typeorm';
import { AppDataSourceReadWrite, AppDataSourceRead } from '@orm/db';
import { AccountSettingsNotificationType } from '@orm/entities/account/accountSettings/accountSettingsNotificationType';
import { AccountSettings } from '@orm/entities/account/accountSettings/accountSettings';

type CreateDto = {
  account_id: number;
  type: AccountNotificationTypeValues;
};

export class AccountSettingsNotificationTypeService {
  protected repositoryReadWrite: Repository<AccountSettingsNotificationType>;
  protected repositoryRead: Repository<AccountSettingsNotificationType>;

  constructor() {
    this.repositoryReadWrite = AppDataSourceReadWrite.getRepository(AccountSettingsNotificationType);
    this.repositoryRead = AppDataSourceRead.getRepository(AccountSettingsNotificationType);
  }

  async create(dto: CreateDto): Promise<AccountSettingsNotificationType> {
    const accountSettingsRepo = AppDataSourceRead.getRepository(AccountSettings);
    const accountSettings = await accountSettingsRepo.findOne({ where: { account_id: dto.account_id }, relations: ['account_settings_notification'] });
    if (!accountSettings || !accountSettings.account_settings_notification) {
      throw new Error('AccountSettingsNotification not found for account');
    }

    const parent = accountSettings.account_settings_notification;

    const obj = this.repositoryReadWrite.create({
      type: dto.type,
      account_settings_notification: parent,
    });

    return this.repositoryReadWrite.save(obj);
  }

  async delete(type: AccountNotificationTypeValues, account_id: number): Promise<void> {
    console.debug('[AccountSettingsNotificationTypeService.delete] start', { type, account_id });

    const accountSettingsRepo = AppDataSourceRead.getRepository(AccountSettings);
    const accountSettings = await accountSettingsRepo.findOne({ where: { account_id }, relations: ['account_settings_notification'] });
    console.debug('[AccountSettingsNotificationTypeService.delete] fetched accountSettings', { accountSettingsId: accountSettings?.id, hasNotification: !!accountSettings?.account_settings_notification });

    if (!accountSettings || !accountSettings.account_settings_notification) {
      console.debug('[AccountSettingsNotificationTypeService.delete] no account_settings_notification found', { account_id });
      throw new Error('AccountSettingsNotification not found for account');
    }

    const parentId = accountSettings.account_settings_notification.id;
    console.debug('[AccountSettingsNotificationTypeService.delete] parentId', { parentId });

    const item = await this.repositoryRead.findOne({
      where: {
        type,
        account_settings_notification: {
          id: parentId
        }
      },
      relations: ['account_settings_notification']
    });
    console.debug('[AccountSettingsNotificationTypeService.delete] queried item', {
      itemId: item?.id,
      itemType: item?.type,
      itemParentId: item?.account_settings_notification?.id
    });

    if (!item) {
      console.debug('[AccountSettingsNotificationTypeService.delete] item not found; nothing to delete', { type, account_id, parentId });
      return;
    }

    // sanity-check before delete
    if (item.type !== type || item.account_settings_notification?.id !== parentId) {
      console.warn('[AccountSettingsNotificationTypeService.delete] mismatch before delete', {
        expected: { type, parentId },
        found: { type: item.type, parentId: item.account_settings_notification?.id, itemId: item.id }
      });
    } else {
      console.debug('[AccountSettingsNotificationTypeService.delete] match verified; removing', { itemId: item.id });
    }

    await this.repositoryReadWrite.remove(item);
    console.debug('[AccountSettingsNotificationTypeService.delete] remove completed', { itemId: item.id });

    return;
  }
}
