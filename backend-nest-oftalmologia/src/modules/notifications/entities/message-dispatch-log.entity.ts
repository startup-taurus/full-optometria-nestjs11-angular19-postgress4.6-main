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
import { Patient } from '../../patients/entities/patient.entity';
import { Campaign } from './campaign.entity';

export enum DispatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('message_dispatch_logs')
@Index(['companyId'])
@Index(['branchId'])
@Index(['patientId'])
@Index(['status'])
@Index(['scheduledAt'])
export class MessageDispatchLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'campaign_id', nullable: true })
  campaignId: string;

  @Column({ type: 'varchar', length: 20, default: DispatchStatus.PENDING })
  status: DispatchStatus;

  @Column({ length: 24 })
  channel: string;

  @Column({ name: 'phone', length: 30 })
  phone: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'provider_message_id', nullable: true })
  providerMessageId: string;

  @Column({ name: 'error_reason', type: 'text', nullable: true })
  errorReason: string;

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

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Campaign, { nullable: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;
}
