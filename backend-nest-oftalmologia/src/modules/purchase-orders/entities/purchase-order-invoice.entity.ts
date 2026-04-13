import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { PurchaseOrderInvoiceLog } from './purchase-order-invoice-log.entity';
import { Company } from '../../companies/entities/company.entity';
import { Branch } from '../../branches/entities/branch.entity';

export enum PurchaseOrderInvoiceState {
  NEW = 'NEW',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
  NOT_APPROVED = 'NOT_APPROVED',
  AUTHORIZED = 'AUTHORIZED',
  FAILED = 'FAILED',
}

@Entity('purchase_order_invoices')
@Index(['purchaseOrderId'], { unique: true })
@Index(['companyId'])
@Index(['branchId'])
@Index(['state'])
@Index(['accessKey'])
export class PurchaseOrderInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_order_id', type: 'uuid', unique: true })
  purchaseOrderId: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({
    name: 'external_invoice_id',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  externalInvoiceId: string | null;

  @Column({
    name: 'invoice_number',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  invoiceNumber: string | null;

  @Column({ name: 'access_key', type: 'varchar', length: 120, nullable: true })
  accessKey: string | null;

  @Column({
    name: 'state',
    type: 'varchar',
    length: 32,
    default: PurchaseOrderInvoiceState.NEW,
  })
  state: PurchaseOrderInvoiceState;

  @Column({ name: 'payment_method', type: 'varchar', length: 4 })
  paymentMethod: string;

  @Column({ name: 'tax_percent', type: 'smallint' })
  taxPercent: number;

  @Column({
    name: 'subtotal',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  subtotal: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalAmount: number;

  @Column({ name: 'xml_base64', type: 'text', nullable: true })
  xmlBase64: string | null;

  @Column({
    name: 'authorization_number',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  authorizationNumber: string | null;

  @Column({ name: 'authorization_date', type: 'timestamptz', nullable: true })
  authorizationDate: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'last_request_payload', type: 'jsonb', nullable: true })
  lastRequestPayload: Record<string, unknown> | null;

  @Column({ name: 'last_response_payload', type: 'jsonb', nullable: true })
  lastResponsePayload: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.invoice)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @OneToMany(() => PurchaseOrderInvoiceLog, (log) => log.invoice)
  logs: PurchaseOrderInvoiceLog[];
}
