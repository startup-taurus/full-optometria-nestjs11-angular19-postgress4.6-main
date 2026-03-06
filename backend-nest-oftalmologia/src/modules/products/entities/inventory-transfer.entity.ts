import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('inventory_transfers')
export class InventoryTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'source_branch_id' })
  sourceBranchId: string;

  @Column({ name: 'target_branch_id' })
  targetBranchId: string;

  @Column({ name: 'source_product_id' })
  sourceProductId: string;

  @Column({ name: 'target_product_id' })
  targetProductId: string;

  @Column({ name: 'source_code' })
  sourceCode: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdByUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'source_product_id' })
  sourceProduct: Product;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'target_product_id' })
  targetProduct: Product;
}
