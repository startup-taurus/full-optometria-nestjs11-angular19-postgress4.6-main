import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Patient } from './patient.entity';
import { Company } from '../../companies/entities/company.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('clients')
@Index(['documentNumber', 'companyId'])
@Index(['patientId'])
@Index(['companyId'])
@Index(['branchId'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  email: string;

  @Column({ name: 'document_number' })
  documentNumber: string;

  @Column({ name: 'patient_id' })
  patientId: string | null;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ name: 'mobile_phone', nullable: true })
  mobilePhone: string;

  @Column({ name: 'home_phone', nullable: true })
  homePhone: string;

  @Column({ name: 'address', nullable: true })
  address: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient | null;

  @ManyToMany(() => Patient)
  @JoinTable({
    name: 'client_patients',
    joinColumn: {
      name: 'client_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'patient_id',
      referencedColumnName: 'id',
    },
  })
  patients: Patient[];

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
