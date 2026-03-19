import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../users/entities/user.entity';

export enum WhatsAppSessionStatus {
  DISCONNECTED = 'disconnected',
  QR_READY = 'qr_ready',
  CONNECTED = 'connected',
}

@Entity('whatsapp_sessions')
@Index(['companyId'])
@Index(['branchId'])
@Index(['userId'])
@Index(['status'])
@Index(['companyId', 'branchId', 'userId'], { unique: true })
export class WhatsAppSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'session_key', unique: true })
  sessionKey: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: WhatsAppSessionStatus.DISCONNECTED,
  })
  status: WhatsAppSessionStatus;

  @Column({ name: 'qr_code', type: 'text', nullable: true })
  qrCode: string;

  @Column({ name: 'connected_phone', nullable: true })
  connectedPhone: string;

  @Column({ name: 'last_connected_at', type: 'timestamp', nullable: true })
  lastConnectedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
