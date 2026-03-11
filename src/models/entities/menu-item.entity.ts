import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Short hash identifier, e.g. NAV-81F3 */
  @Column({ unique: true, length: 20 })
  @Index()
  hashId!: string;

  @Column({ length: 255 })
  label!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon!: string | null;

  /** Frontend route path */
  @Column({ type: 'varchar', length: 500, nullable: true })
  route!: string | null;

  /** Parent menu item ID for tree structure (null = top-level) */
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => MenuItem, (item) => item.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent!: MenuItem | null;

  @OneToMany(() => MenuItem, (item) => item.parent)
  children!: MenuItem[];

  /** Privilege code required to see this menu item */
  @Column({ name: 'privilege_code', type: 'varchar', length: 100, nullable: true })
  privilegeCode!: string | null;

  /** Sort order within the same level/section */
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  /** Logical section grouping (e.g. 'main', 'admin', 'settings') */
  @Column({ type: 'varchar', length: 100, nullable: true })
  section!: string | null;

  /** Organization this menu belongs to */
  @Column({ name: 'organization_hash_id', length: 20 })
  @Index()
  organizationHashId!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
