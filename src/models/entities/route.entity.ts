import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Short hash identifier, e.g. RTE-92AF */
  @Column({ unique: true, length: 20 })
  @Index()
  hashId!: string;

  /** Logical route path, e.g. '/customers' */
  @Column({ length: 500 })
  path!: string;

  /** Frontend route path, e.g. '/app/customers' */
  @Column({ name: 'frontend_path', length: 500 })
  frontendPath!: string;

  /** Backend API path, e.g. '/api/v1/O/:orgId/customers' */
  @Column({ name: 'backend_path', length: 500 })
  backendPath!: string;

  /** HTTP method: GET, POST, PUT, DELETE, etc. */
  @Column({ length: 10, default: 'GET' })
  method!: string;

  /** Privilege code required to access this route */
  @Column({ name: 'privilege_code', length: 100, nullable: true })
  privilegeCode!: string | null;

  /** Organization this route belongs to */
  @Column({ name: 'organization_hash_id', length: 20 })
  @Index()
  organizationHashId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
