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
import { Company } from '../../companies/entities/company.entity';

@Entity('clinical_histories')
@Index(['companyId'])
@Index(['branchId'])
@Index(['patientId'])
@Index(['branchId', 'isSent'])
export class ClinicalHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'professional_name', nullable: true })
  professionalName: string;

  @Column({ name: 'is_sent', default: false })
  isSent: boolean;

  @Column({ name: 'occupation', nullable: true })
  occupation: string;

  @Column({ name: 'first_time', default: false })
  firstTime: boolean;

  @Column({ name: 'last_visual_exam_date', nullable: true })
  lastVisualExamDate: Date;

  @Column({ name: 'vision_problems', type: 'text', nullable: true })
  visionProblems: string;

  @Column({ name: 'general_health', type: 'text', nullable: true })
  generalHealth: string;

  @Column({ name: 'other_health_problems', type: 'text', nullable: true })
  otherHealthProblems: string;

  @Column({ name: 'segment_anterior', nullable: true })
  segmentAnterior: string; // OD/OI/A.O.

  @Column({ name: 'segment_anterior_other', nullable: true })
  segmentAnteriorOther: string;

  @Column({ name: 'previous_rx_od', nullable: true })
  previousRxOd: string;

  @Column({ name: 'previous_add_od', nullable: true })
  previousAddOd: string;

  @Column({ name: 'previous_od_vl', nullable: true })
  previousOdVl: string;

  @Column({ name: 'previous_od_vp', nullable: true })
  previousOdVp: string;

  @Column({ name: 'previous_rx_oi', nullable: true })
  previousRxOi: string;

  @Column({ name: 'previous_add_oi', nullable: true })
  previousAddOi: string;

  @Column({ name: 'previous_oi_vl', nullable: true })
  previousOiVl: string;

  @Column({ name: 'previous_oi_vp', nullable: true })
  previousOiVp: string;

  @Column({ name: 'previous_ao', nullable: true })
  previousAo: string;

  @Column({ name: 'visual_acuity_od_vl', nullable: true })
  visualAcuityOdVl: string;

  @Column({ name: 'visual_acuity_od_vp', nullable: true })
  visualAcuityOdVp: string;

  @Column({ name: 'visual_acuity_oi_vl', nullable: true })
  visualAcuityOiVl: string;

  @Column({ name: 'visual_acuity_oi_vp', nullable: true })
  visualAcuityOiVp: string;

  @Column({ type: 'jsonb', nullable: true })
  motorTest: {
    exophoria?: { applies: string; value: string }; // OD/OI/A.O.
    endophoria?: { applies: string; value: string };
    exotropia?: { applies: string; value: string };
    endotropia?: { applies: string; value: string };
    hyperphoria?: { applies: string; value: string };
    hypotropia?: { applies: string; value: string };
    alternating?: { applies: string; value: string };
  };

  @Column({ name: 'final_rx_od_sphere', nullable: true })
  finalRxOdSphere: string;

  @Column({ name: 'final_rx_od_cylinder', nullable: true })
  finalRxOdCylinder: string;

  @Column({ name: 'final_rx_od_axis', nullable: true })
  finalRxOdAxis: string;

  @Column({ name: 'final_rx_od_add', nullable: true })
  finalRxOdAdd: string;

  @Column({ name: 'final_rx_oi_sphere', nullable: true })
  finalRxOiSphere: string;

  @Column({ name: 'final_rx_oi_cylinder', nullable: true })
  finalRxOiCylinder: string;

  @Column({ name: 'final_rx_oi_axis', nullable: true })
  finalRxOiAxis: string;

  @Column({ name: 'final_rx_oi_add', nullable: true })
  finalRxOiAdd: string;

  @Column({ name: 'corrected_av_od_vl', nullable: true })
  correctedAvOdVl: string;

  @Column({ name: 'corrected_av_od_vp', nullable: true })
  correctedAvOdVp: string;

  @Column({ name: 'corrected_av_oi_vl', nullable: true })
  correctedAvOiVl: string;

  @Column({ name: 'corrected_av_oi_vp', nullable: true })
  correctedAvOiVp: string;

  @Column({ type: 'jsonb', nullable: true })
  lensTypes: string[];

  @Column({ type: 'jsonb', nullable: true })
  additionalTreatments: string[];

  @Column({ type: 'jsonb', nullable: true })
  pupillaryReflexes: {
    photomotor?: { od: string; oi: string };
    consensual?: { od: string; oi: string };
    accommodative?: { od: string; oi: string };
  };

  @Column({ name: 'ophthalmoscopy_od', type: 'text', nullable: true })
  ophthalmoscopyOd: string;

  @Column({ name: 'ophthalmoscopy_oi', type: 'text', nullable: true })
  ophthalmoscopyOi: string;

  @Column({ type: 'jsonb', nullable: true })
  refractiveTests: {
    keratometry?: { od: string; oi: string };
    autorefract?: { od: string; oi: string };
    refraction?: { od: string; oi: string };
    subjective?: { od: string; oi: string };
  };

  @Column({ name: 'stereopsis', nullable: true })
  stereopsis: string;

  @Column({ name: 'worth_test', nullable: true })
  worthTest: string;

  @Column({ name: 'other_notes', type: 'text', nullable: true })
  otherNotes: string;

  @Column({ name: 'diagnosis', type: 'text', nullable: true })
  diagnosis: string;

  @Column({ name: 'disposition', type: 'text', nullable: true })
  disposition: string;

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

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
