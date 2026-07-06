import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Plan } from './plan.entity';

@Entity('company_subscriptions')
export class CompanySubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'plan_id', nullable: true })
  planId: string | null;

  @Column({ name: 'plan_code', nullable: true })
  planCode: string | null;

  @Column({ name: 'external_subscription_id', nullable: true })
  externalSubscriptionId: string | null;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'billing_cycle', nullable: true })
  billingCycle: string | null;

  @Column({ name: 'amount_cents', type: 'int', nullable: true })
  amountCents: number | null;

  @Column({ nullable: true })
  currency: string | null;

  @Column({ name: 'card_brand', nullable: true })
  cardBrand: string | null;

  @Column({ name: 'card_last4', nullable: true })
  cardLast4: string | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'canceled_at', type: 'timestamptz', nullable: true })
  canceledAt: Date | null;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
