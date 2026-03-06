import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'movement_type' })
  movementType: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter: number;

  @Column({ name: 'reference_type', nullable: true })
  referenceType: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdByUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
