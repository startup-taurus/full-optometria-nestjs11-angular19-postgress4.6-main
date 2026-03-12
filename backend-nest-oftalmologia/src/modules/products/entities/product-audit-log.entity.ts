import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

export const ProductAuditEventType = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  DISCOUNT_APPLIED: 'DISCOUNT_APPLIED',
  DISCOUNT_REMOVED: 'DISCOUNT_REMOVED',
  DEACTIVATED: 'DEACTIVATED',
} as const;

@Entity('product_audit_log')
export class ProductAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 30 })
  eventType: string;

  @Column({ name: 'changed_fields', type: 'jsonb', nullable: true })
  changedFields: Record<string, any> | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdByUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
