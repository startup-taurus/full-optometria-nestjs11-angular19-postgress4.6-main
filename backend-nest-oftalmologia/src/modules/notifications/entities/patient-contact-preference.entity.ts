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
import { Patient } from '../../patients/entities/patient.entity';

@Entity('patient_contact_preferences')
@Index(['companyId'])
@Index(['branchId'])
@Index(['patientId'])
@Index(['companyId', 'branchId', 'patientId'], { unique: true })
export class PatientContactPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'preferred_phone', nullable: true })
  preferredPhone: string;

  @Column({ name: 'whatsapp_opt_in', default: false })
  whatsappOptIn: boolean;

  @Column({ name: 'promotions_opt_in', default: false })
  promotionsOptIn: boolean;

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

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
