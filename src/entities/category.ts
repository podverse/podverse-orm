import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm'
import { Podcast } from './'
import { generateShortId } from '../lib/shortid'

@Entity('categories')
export class Category {
  @PrimaryColumn('varchar', {
    default: generateShortId(),
    length: 14
  })
  id: string

  @Index()
  @Column()
  @Generated('increment')
  int_id: number

  @Index()
  @Column({ unique: true })
  fullPath: string

  @Index()
  @Column()
  slug: string

  @Index()
  @Column({ unique: true })
  title: string

  @ManyToOne(() => Category, (category) => category.categories, { onDelete: 'CASCADE' })
  category: Category

  @OneToMany(() => Category, (category) => category.category)
  categories: Category[]

  @ManyToMany(() => Podcast, (podcast) => podcast.categories)
  podcasts: Podcast[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @BeforeInsert()
  @BeforeUpdate()
  addSlug() {
    const slug = this.title.replace(/\s+/g, '-').toLowerCase().trim()
    this.slug = slug.replace(/\W/g, '')
  }

  @BeforeInsert()
  beforeInsert() {
    this.id = generateShortId()
  }
}
