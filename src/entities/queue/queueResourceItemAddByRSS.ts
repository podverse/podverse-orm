import { Column, Entity, Unique } from "typeorm";
import { QueueResourceBase } from "@orm/entities/queue/queueResourceBase";

@Entity()
@Unique(['queue'])
export class QueueResourceItemAddByRSS extends QueueResourceBase {
  @Column()
  hash_id!: string;
  
  @Column({ type: 'jsonb' })
  resource_data!: object;
}