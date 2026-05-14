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
import { Company } from '../../companies/entities/company.entity';

@Entity('patients')
@Index(['companyId'])
@Index(['branchId'])
@Index(['documentNumber', 'companyId'], { unique: true })
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true, nullable: true })
  email: string | null;

  @Column({ name: 'document_number', nullable: true })
  documentNumber: string | null;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ name: 'date_of_birth', nullable: true })
  dateOfBirth: Date | null;

  @Column({ name: 'birth_year', type: 'smallint', nullable: true })
  birthYear: number | null;

  @Column({ name: 'address', nullable: true })
  address: string;

  @Column({ name: 'home_phone', nullable: true })
  homePhone: string;

  @Column({ name: 'mobile_phone', nullable: true })
  mobilePhone: string;

  @Column({ name: 'profile_photo', nullable: true })
  profilePhoto: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
