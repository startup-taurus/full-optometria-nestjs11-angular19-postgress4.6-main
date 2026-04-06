import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('purchase_order_items')
@Index(['purchaseOrderId'])
@Index(['productId'])
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_order_id' })
  purchaseOrderId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'product_code' })
  productCode: string;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'product_brand', nullable: true })
  productBrand: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ name: 'line_total', type: 'decimal', precision: 12, scale: 2 })
  lineTotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;
}