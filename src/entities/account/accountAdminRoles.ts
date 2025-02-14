import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from 'typeorm';
import { Account } from '@orm/entities/account/account';

@Entity()
export class AccountAdminRoles {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Account, account => account.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @Column({ type: 'boolean', default: false })
  dev_admin!: boolean;

  @Column({ type: 'boolean', default: false })
  podping_admin!: boolean;
}