import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { User } from './'

// https://developers.google.com/android-publisher/api-ref/purchases/products#resource

@Entity('googlePlayPurchase')
export class GooglePlayPurchase {
  @PrimaryColumn('varchar')
  transactionId: string

  @Column({ nullable: true })
  acknowledgementState: number | null

  @Column({ nullable: true })
  consumptionState: number | null

  @Column({ nullable: true })
  developerPayload: string | null

  @Column({ nullable: true })
  kind: string | null

  @Column()
  productId: string

  @Column({ nullable: true })
  purchaseTimeMillis: string | null

  @Column({ nullable: true })
  purchaseState: number | null

  @Column({ unique: true })
  purchaseToken: string

  @ManyToOne(() => User, (user) => user.googlePlayPurchases, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  owner: User

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
