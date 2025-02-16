import { EntityManager } from 'typeorm';
import { AccountFollowingAccount } from '@orm/entities/account/accountFollowingAccount';
import { BaseManyService } from '@orm/services/base/baseManyService';
import { AccountService } from '@orm/services/account/account';

export type AccountFollowingAccountDto = {
  following_account_id: number;
};

export class AccountFollowingAccountService extends BaseManyService<AccountFollowingAccount, 'account'> {
  private accountService: AccountService;

  constructor(transactionalEntityManager?: EntityManager) {
    super(AccountFollowingAccount, 'account', transactionalEntityManager);
    this.accountService = new AccountService();
  }

  async followAccount(account_id: number, dto: AccountFollowingAccountDto): Promise<AccountFollowingAccount> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    if (account.id === dto.following_account_id) {
      console.error("You cannot follow your own account.");
      throw new Error("You cannot follow your own account.");
    }

    return this._update(
      account,
      ['account_id', 'following_account_id'],
      dto
    );
  }

  async unfollowAccount(account_id: number, dto: AccountFollowingAccountDto): Promise<void> {
    const account = await this.accountService.get(account_id);
    if (!account) {
      throw new Error("Account not found.");
    }

    if (account.id === dto.following_account_id) {
      throw new Error("You cannot unfollow your own account.");
    }

    return this._delete(account, { following_account_id: dto.following_account_id });
  }
}