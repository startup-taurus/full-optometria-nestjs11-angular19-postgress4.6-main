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
import { Branch } from '../../branches/entities/branch.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Product } from '../../products/entities/product.entity';
import { ClinicalHistory } from '../../clinical-histories/entities/clinical-history.entity';
import { Company } from '../../companies/entities/company.entity';
import { Client } from '../../patients/entities/client.entity';

export enum FrameType {
  THREE_PIECES_AIR = '3_piezas_al_aire',
  SEMI_AIR_GROOVED = 'ranurado_semiaire',
  COMPLETE = 'completo',
}

export enum LaboratoryOrderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  RECEIVED = 'received',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('laboratory_orders')
@Index('UQ_laboratory_orders_company_order_number', ['companyId', 'orderNumber'], {
  unique: true,
  where: '"company_id" IS NOT NULL AND "order_number" IS NOT NULL',
})
@Index('UQ_laboratory_orders_null_company_order_number', ['orderNumber'], {
  unique: true,
  where: '"company_id" IS NULL AND "order_number" IS NOT NULL',
})
@Index(['companyId'])
@Index(['branchId'])
@Index(['patientId'])
@Index(['clientId'])
@Index(['isConfirmed'])
@Index(['status'])
@Index(['attendanceDate'])
@Index(['createdByUserId'])
export class LaboratoryOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', nullable: true })
  orderNumber: number;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdByUserId: string | null;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'clinical_history_id', nullable: true })
  clinicalHistoryId: string;

  @Column({ name: 'client_id', nullable: true })
  clientId: string;

  // Step 1: Datos del Cliente
  @Column({ name: 'attendance_date', type: 'date', nullable: true })
  attendanceDate: Date;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate: Date;

  // Step 2: Productos (Medidas Ópticas)
  @Column({ name: 'od_sphere', nullable: true })
  odSphere: string;

  @Column({ name: 'od_cylinder', nullable: true })
  odCylinder: string;

  @Column({ name: 'od_axis', nullable: true })
  odAxis: string;

  @Column({ name: 'od_add', nullable: true })
  odAdd: string;

  @Column({ name: 'od_height', nullable: true })
  odHeight: string;

  @Column({ name: 'od_dnp', nullable: true })
  odDnp: string;

  @Column({ name: 'oi_sphere', nullable: true })
  oiSphere: string;

  @Column({ name: 'oi_cylinder', nullable: true })
  oiCylinder: string;

  @Column({ name: 'oi_axis', nullable: true })
  oiAxis: string;

  @Column({ name: 'oi_add', nullable: true })
  oiAdd: string;

  @Column({ name: 'oi_height', nullable: true })
  oiHeight: string;

  @Column({ name: 'oi_dnp', nullable: true })
  oiDnp: string;

  @Column({ name: 'cbase', nullable: true })
  cbase: string;

  @Column({ name: 'sun_degree', nullable: true })
  sunDegree: string;

  @Column({ name: 'prism', nullable: true })
  prism: string;

  @Column({ name: 'base', nullable: true })
  base: string;

  @Column({ name: 'd_vertex', nullable: true })
  dVertex: string;

  @Column({ name: 'pantos', nullable: true })
  pantos: string;

  @Column({ name: 'panora', nullable: true })
  panora: string;

  @Column({ name: 'frame_fit', nullable: true })
  frameFit: string;

  @Column({ name: 'profile', nullable: true })
  profile: string;

  @Column({ name: 'mid', nullable: true })
  mid: string;

  @Column({ name: 'dist_vp', nullable: true })
  distVp: string;

  @Column({ name: 'engraving', nullable: true })
  engraving: string;

  // Step 4: Datos de la Montura
  @Column({ name: 'product_id', nullable: true })
  productId: string;

  @Column({ name: 'product_ids', type: 'uuid', array: true, nullable: true })
  productIds: string[];

  @Column({ name: 'product_quantities', type: 'jsonb', nullable: true })
  productQuantities: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    discount?: number;
  }>;

  @Column({
    type: 'enum',
    enum: FrameType,
    name: 'frame_type',
    nullable: true,
  })
  frameType: FrameType;

  @Column({ name: 'frame_type_description', nullable: true })
  frameTypeDescription: string;

  @Column({ name: 'frame_brand', nullable: true })
  frameBrand: string;

  @Column({ name: 'frame_model', nullable: true })
  frameModel: string;

  @Column({ name: 'frame_data', nullable: true })
  frameData: string;

  @Column({ name: 'frame_larger_diameter', nullable: true })
  frameLargerDiameter: string;

  @Column({ name: 'frame_horizontal', nullable: true })
  frameHorizontal: string;

  @Column({ name: 'frame_vertical', nullable: true })
  frameVertical: string;

  @Column({ name: 'frame_bridge', nullable: true })
  frameBridge: string;

  @Column({ name: 'observations', type: 'text', nullable: true })
  observations: string;

  // Estado
  @Column({ name: 'is_confirmed', default: false })
  isConfirmed: boolean;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: LaboratoryOrderStatus.PENDING,
  })
  status: LaboratoryOrderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ClinicalHistory, { nullable: true })
  @JoinColumn({ name: 'clinical_history_id' })
  clinicalHistory: ClinicalHistory;
}
