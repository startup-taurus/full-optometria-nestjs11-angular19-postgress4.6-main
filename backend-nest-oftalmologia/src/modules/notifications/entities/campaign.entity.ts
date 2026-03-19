import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Company } from '../../companies/entities/company.entity';

export enum CampaignType {
  REMINDER = 'reminder',
  PROMOTION = 'promotion',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('notification_campaigns')
@Index(['companyId'])
@Index(['branchId'])
@Index(['status'])
@Index(['scheduledAt'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 20, default: CampaignType.REMINDER })
  type: CampaignType;

  @Column({
    type: 'varchar',
    length: 20,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({ name: 'message_template', type: 'text' })
  messageTemplate: string;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
