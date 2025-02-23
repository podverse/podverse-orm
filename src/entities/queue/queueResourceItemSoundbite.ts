import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { ItemSoundbite } from "@orm/entities/item/itemSoundbite";
import { QueueResourceBase } from "@orm/entities/queue/queueResourceBase";

@Entity()
@Unique(['queue'])
export class QueueResourceItemSoundbite extends QueueResourceBase {
  @Column()
  soundbite_id!: string;

  @ManyToOne(() => ItemSoundbite, itemSoundbite => itemSoundbite.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'soundbite_id' })
  soundbite!: ItemSoundbite;
}