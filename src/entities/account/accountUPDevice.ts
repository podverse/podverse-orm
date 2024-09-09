import { DATABASE_CONSTANTS } from 'podverse-helpers';
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from '@orm/entities/account/account';

@Entity()
export class AccountUpDevice {
  @PrimaryColumn({ type: 'varchar', length: DATABASE_CONSTANTS.varchar_url })
  up_endpoint!: string;

  @Column({ type: 'varchar', length: DATABASE_CONSTANTS.varchar_long })
  up_public_key!: string;

  @Column({ type: 'varchar', length: DATABASE_CONSTANTS.varchar_long })
  up_auth_key!: string;

  @Column()
  account_id!: number;

  @ManyToOne(() => Account, account => account.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: Account;
}