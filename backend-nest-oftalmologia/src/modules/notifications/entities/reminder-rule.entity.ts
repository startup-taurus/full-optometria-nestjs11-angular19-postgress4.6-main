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

@Entity('reminder_rules')
@Index(['companyId'])
@Index(['branchId'])
@Index(['companyId', 'branchId'], { unique: true })
export class ReminderRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'appointment_reminder_hours_before', default: 24 })
  appointmentReminderHoursBefore: number;

  @Column({ name: 'renewal_after_days', default: 365 })
  renewalAfterDays: number;

  @Column({ name: 'renewal_notify_before_days', default: 15 })
  renewalNotifyBeforeDays: number;

  @Column({ name: 'quiet_hours_start', default: '21:00' })
  quietHoursStart: string;

  @Column({ name: 'quiet_hours_end', default: '08:00' })
  quietHoursEnd: string;

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
