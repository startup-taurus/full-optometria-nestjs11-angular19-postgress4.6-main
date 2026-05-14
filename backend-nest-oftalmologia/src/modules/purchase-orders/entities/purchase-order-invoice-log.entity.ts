import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PurchaseOrderInvoice } from './purchase-order-invoice.entity';

export enum PurchaseOrderInvoiceLogAction {
  CREATE = 'CREATE',
  RETRY = 'RETRY',
  AUTHORIZE = 'AUTHORIZE',
  XML = 'XML',
  STATUS_SYNC = 'STATUS_SYNC',
}

@Entity('purchase_order_invoice_logs')
@Index(['invoiceId'])
@Index(['purchaseOrderId'])
@Index(['action'])
export class PurchaseOrderInvoiceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id', type: 'uuid' })
  invoiceId: string;

  @Column({ name: 'purchase_order_id', type: 'uuid', nullable: true })
  purchaseOrderId: string | null;

  @Column({ name: 'action', type: 'varchar', length: 24 })
  action: PurchaseOrderInvoiceLogAction;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ name: 'request_payload', type: 'jsonb', nullable: true })
  requestPayload: Record<string, unknown> | null;

  @Column({ name: 'response_payload', type: 'jsonb', nullable: true })
  responsePayload: Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => PurchaseOrderInvoice, (invoice) => invoice.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  invoice: PurchaseOrderInvoice;
}
