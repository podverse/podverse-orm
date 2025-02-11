
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { Account } from '@orm/entities/account/account';
import { AppDataSourceRead, AppDataSourceReadWrite } from '@orm/db';
import { AccountMembershipEnum, SharableStatusEnum, hashPassword, validateEmail, validatePassword } from 'podverse-helpers';
import { SharableStatus } from '@orm/entities/sharableStatus';
import { AccountCredentialsService } from './accountCredentials';
import { AccountMembershipStatusService } from './accountMembershipStatus';

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
    
    if (validatePassword(dto.password)) {
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
      throw new Error('Account already exists');
    }

    const account = new Account();
    account.sharable_status = sharableStatus;
    account.verified = false;

    const newAccount = this.repositoryReadWrite.create(account);
    const saltedPassword = await hashPassword(dto.password);

    await accountCredentialsService.update(newAccount, {
      email: dto.email,
      password: saltedPassword
    });

    const accountMembershipStatusService = new AccountMembershipStatusService();
    await accountMembershipStatusService.update(newAccount, {
      account_membership_id: AccountMembershipEnum.Trial,
      membership_expires_at: new Date()
    });
  }
}
