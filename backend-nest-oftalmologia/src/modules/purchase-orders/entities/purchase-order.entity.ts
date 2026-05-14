import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Client } from '../../patients/entities/client.entity';
import { LaboratoryOrder } from '../../laboratory-orders/entities/laboratory-order.entity';
import { Company } from '../../companies/entities/company.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseOrderInvoice } from './purchase-order-invoice.entity';

export enum PurchaseOrderStatus {
  PENDING = 'pending',
  INVOICED = 'invoiced',
  CANCELLED = 'cancelled',
}

@Entity('purchase_orders')
@Index('UQ_purchase_orders_company_order_number', ['companyId', 'orderNumber'], {
  unique: true,
  where: '"company_id" IS NOT NULL AND "order_number" IS NOT NULL',
})
@Index('UQ_purchase_orders_null_company_order_number', ['orderNumber'], {
  unique: true,
  where: '"company_id" IS NULL AND "order_number" IS NOT NULL',
})
@Index(['laboratoryOrderId'], { unique: true })
@Index(['clientId'])
@Index(['companyId'])
@Index(['status'])
@Index(['shouldInvoice'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', nullable: true })
  orderNumber: number;

  @Column({ name: 'client_id', nullable: true })
  clientId: string | null;

  @Column({ name: 'laboratory_order_id', unique: true })
  laboratoryOrderId: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ name: 'should_invoice', default: false })
  shouldInvoice: boolean;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: PurchaseOrderStatus.PENDING,
  })
  status: PurchaseOrderStatus;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  totalAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client | null;

  @OneToOne(() => LaboratoryOrder)
  @JoinColumn({ name: 'laboratory_order_id' })
  laboratoryOrder: LaboratoryOrder;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder)
  items: PurchaseOrderItem[];

  @OneToOne(() => PurchaseOrderInvoice, (invoice) => invoice.purchaseOrder)
  invoice: PurchaseOrderInvoice;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
