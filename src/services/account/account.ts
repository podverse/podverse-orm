import { ERROR_MESSAGES } from 'podverse-helpers';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Account } from '@orm/entities/account/account';
import { AppDataSourceRead, AppDataSourceReadWrite } from '@orm/db';
import { AccountMembershipEnum, SharableStatusEnum, hashPassword, validateEmail, validatePassword } from 'podverse-helpers';
import { SharableStatus } from '@orm/entities/sharableStatus';
import { AccountCredentialsService } from './accountCredentials';
import { AccountMembershipStatusService } from './accountMembershipStatus';
import { AccountVerificationService } from './accountVerification';
import { AccountResetPasswordService } from './accountResetPassword';

type CreateAccountDto = {
  email: string
  password: string
}

export class AccountService {
  protected repositoryRead: Repository<Account>;
  protected repositoryReadWrite: Repository<Account>;

  constructor() {
    this.repositoryRead = AppDataSourceRead.getRepository(Account);
    this.repositoryReadWrite = AppDataSourceReadWrite.getRepository(Account);
  }

  async get(id: number, config?: FindOneOptions<Account>): Promise<Account | null> {
    if (!id) {
      return null;
    }
    return this.repositoryRead.findOne({ where: { id }, ...config });
  }

  async getByEmail(email: string, config?: FindOneOptions<Account>): Promise<Account | null> {
    const accountCredentialsService = new AccountCredentialsService();
    const accountCredentials = await accountCredentialsService.getByEmail(email);
    if (!accountCredentials) {
      return null;
    }

    return this.get(accountCredentials.account_id, config);
  }

  async _getByIdText(id_text: string, config?: FindOneOptions<Account>): Promise<Account | null> {
    if (!id_text) {
      return null;
    }
    return this.repositoryRead.findOne({ where: { id_text }, ...config });
  }

  async getMany(config: FindManyOptions<Account>): Promise<Account[]> {
    return this.repositoryRead.find(config);
  }

  async create(dto: CreateAccountDto) {
    if (!validateEmail(dto.email)) {
      throw new Error('Invalid email');
    }
    
    if (!validatePassword(dto.password)) {
      throw new Error('Invalid password');
    }

    const sharableStatusRepository = AppDataSourceRead.getRepository(SharableStatus);
    const sharableStatus = await sharableStatusRepository.findOne({ where: { id: SharableStatusEnum.Private } });
    if (!sharableStatus) {
      throw new Error('SharableStatus not found');
    }

    const accountCredentialsService = new AccountCredentialsService();
    const accountCredentials = await accountCredentialsService.getByEmail(dto.email);
    if (accountCredentials) {
      throw new Error(ERROR_MESSAGES.ACCOUNT.ALREADY_EXISTS);
    }

    const accountObj = this.repositoryReadWrite.create({
      sharable_status: sharableStatus,
      verified: false
    });
    
    const account = await this.repositoryReadWrite.save(accountObj);
    const saltedPassword = await hashPassword(dto.password);
    
    await accountCredentialsService.update(account, {
      email: dto.email,
      password: saltedPassword
    });

    const accountMembershipStatusService = new AccountMembershipStatusService();
    await accountMembershipStatusService.update(account, {
      account_membership_id: AccountMembershipEnum.Trial,
      membership_expires_at: new Date()
    });
  }

  async verifyEmail(id: number): Promise<void> {
    const account = await this.repositoryReadWrite.findOne({ where: { id } });

    if (!account) {
      throw new Error('Account not found');
    }

    account.verified = true;
    await this.repositoryReadWrite.save(account);

    const accountVerificationService = new AccountVerificationService();
    await accountVerificationService.deleteByAccountId(id);
  }

  async resetPassword(accountId: number, newPassword: string): Promise<void> {
    const account = await this.repositoryReadWrite.findOne({ where: { id: accountId } });

    if (!account) {
      throw new Error('Account not found');
    }

    const saltedPassword = await hashPassword(newPassword);

    const accountCredentialsService = new AccountCredentialsService();
    await accountCredentialsService.update(account, {
      password: saltedPassword
    });

    const accountResetPasswordService = new AccountResetPasswordService();
    await accountResetPasswordService.deleteByAccountId(account.id);
  }
}
