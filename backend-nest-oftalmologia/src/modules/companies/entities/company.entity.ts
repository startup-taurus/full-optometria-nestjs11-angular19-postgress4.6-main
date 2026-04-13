import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { File } from '../../files/entities/file.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ unique: true, nullable: true })
  slug: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'logo_file_id', nullable: true })
  logoFileId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'max_users', type: 'int', nullable: true, default: null })
  maxUsers: number | null;

  @Column({ name: 'max_branches', type: 'int', nullable: true, default: null })
  maxBranches: number | null;

  @Column({ name: 'billing_api_key', nullable: true })
  billingApiKey: string | null;

  @Column({
    name: 'billing_contributor_id',
    type: 'int',
    nullable: true,
    default: null,
  })
  billingContributorId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => File, { nullable: true })
  @JoinColumn({ name: 'logo_file_id' })
  logoFile: File;
}
