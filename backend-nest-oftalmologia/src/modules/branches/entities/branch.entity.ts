import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity('branches')
@Unique(['name', 'companyId'])
@Unique(['code', 'companyId'])
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'corporate_email', nullable: true })
  corporateEmail: string;

  @Column({ name: 'opening_hours', nullable: true })
  openingHours: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
