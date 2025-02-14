import { EntityManager } from 'typeorm';
import { Account } from '@orm/entities/account/account';
import { AccountResetPassword } from '@orm/entities/account/accountResetPassword';
import { BaseOneService } from '@orm/services/base/baseOneService';

export type AccountResetPasswordDto = {
  reset_token: string
  reset_token_expires_at: Date
}

export class AccountResetPasswordService extends BaseOneService<AccountResetPassword, 'account'> {
  constructor(transactionalEntityManager?: EntityManager) {
    super(AccountResetPassword, 'account', transactionalEntityManager);
  }
  
  async get(account: Account): Promise<AccountResetPassword | null> {
    return super._get(account);
  }

  async update(account: Account, dto: AccountResetPasswordDto): Promise<AccountResetPasswordDto> {
    return super._update(account, dto);
  }
}
