import { MediumEnum } from 'podverse-helpers';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, BeforeInsert, Column } from 'typeorm';
import { Account } from '@orm/entities/account/account';
import { Medium } from '@orm/entities/medium';
const shortid = require('shortid');

@Entity()
export class Queue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  id_text!: string;

  @ManyToOne(() => Account, account => account.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: Account;

  @ManyToOne(() => Medium, medium => medium.id)
  @JoinColumn({ name: 'medium_id' })
  medium!: MediumEnum;

  @BeforeInsert()
  generateIdText() {
    this.id_text = shortid.generate();
  }
}
