import { EntityManager } from 'typeorm';
import { Account } from '@orm/entities/account/account';
import { AccountProfile } from '@orm/entities/account/accountProfile';
import { BaseOneService } from '@orm/services/base/baseOneService';

export type AccountProfileDto = {
  display_name?: string | null;
  bio?: string | null;
};

export class AccountProfileService extends BaseOneService<AccountProfile, 'account'> {
  constructor(transactionalEntityManager?: EntityManager) {
    super(AccountProfile, 'account', transactionalEntityManager);
  }

  async update(account: Account, dto: AccountProfileDto): Promise<AccountProfile> {
    const finalDto = {
      display_name: dto.display_name,
      bio: dto.bio
    };

    return super._update(account, finalDto);
  }
}