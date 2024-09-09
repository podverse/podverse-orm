import { DATABASE_CONSTANTS } from 'podverse-helpers';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from '@orm/entities/account/account';

@Entity()
export class AccountCredentials {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Account, account => account.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column({ type: 'varchar', unique: true, length: DATABASE_CONSTANTS.varchar_email })
  email!: string;

  @Column({ type: 'varchar', length : DATABASE_CONSTANTS.varchar_password })
  password!: string;
}
