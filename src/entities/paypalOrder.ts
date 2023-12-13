import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { User } from './'

@Entity('paypalOrders')
export class PayPalOrder {
  @PrimaryColumn('varchar')
  paymentID: string

  @Column({ nullable: true })
  state: string | null

  @ManyToOne(() => User, (user) => user.paypalOrders, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  owner: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
