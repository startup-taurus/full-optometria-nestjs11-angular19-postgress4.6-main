import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Company } from '../../companies/entities/company.entity';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

@Entity('product_discount')
@Unique(['productId', 'branchId'])
export class ProductDiscount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'discount_type', type: 'varchar', length: 20 })
  discountType: DiscountType;

  @Column('decimal', { name: 'discount_value', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
