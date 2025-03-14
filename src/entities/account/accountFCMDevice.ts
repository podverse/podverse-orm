import { DATABASE_CONSTANTS } from 'podverse-helpers';
import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from '@orm/entities/account/account';

@Entity()
export class AccountFCMDevice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true, length: DATABASE_CONSTANTS.varchar_fcm_token })
  fcm_token!: string;

  @Column()
  account_id!: number;

  @ManyToOne(() => Account, account => account.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: Account;
}