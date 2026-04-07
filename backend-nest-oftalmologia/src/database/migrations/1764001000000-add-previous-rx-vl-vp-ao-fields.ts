import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreviousRxVlVpAoFields1764001000000
  implements MigrationInterface
{
  name = 'AddPreviousRxVlVpAoFields1764001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinical_histories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid,
        "branch_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        "professional_name" character varying,
        "is_sent" boolean NOT NULL DEFAULT false,
        "occupation" character varying,
        "first_time" boolean NOT NULL DEFAULT false,
        "last_visual_exam_date" TIMESTAMP,
        "vision_problems" text,
        "general_health" text,
        "other_health_problems" text,
        "segment_anterior" character varying,
        "segment_anterior_other" character varying,
        "previous_rx_od" character varying,
        "previous_add_od" character varying,
        "previous_od_vl" character varying,
        "previous_od_vp" character varying,
        "previous_rx_oi" character varying,
        "previous_add_oi" character varying,
        "previous_oi_vl" character varying,
        "previous_oi_vp" character varying,
        "previous_ao" character varying,
        "visual_acuity_od_vl" character varying,
        "visual_acuity_od_vp" character varying,
        "visual_acuity_oi_vl" character varying,
        "visual_acuity_oi_vp" character varying,
        "motor_test" jsonb,
        "final_rx_od_sphere" character varying,
        "final_rx_od_cylinder" character varying,
        "final_rx_od_axis" character varying,
        "final_rx_od_add" character varying,
        "final_rx_oi_sphere" character varying,
        "final_rx_oi_cylinder" character varying,
        "final_rx_oi_axis" character varying,
        "final_rx_oi_add" character varying,
        "corrected_av_od_vl" character varying,
        "corrected_av_od_vp" character varying,
        "corrected_av_oi_vl" character varying,
        "corrected_av_oi_vp" character varying,
        "lens_types" jsonb,
        "additional_treatments" jsonb,
        "pupillary_reflexes" jsonb,
        "ophthalmoscopy_od" text,
        "ophthalmoscopy_oi" text,
        "refractive_tests" jsonb,
        "stereopsis" character varying,
        "worth_test" character varying,
        "other_notes" text,
        "diagnosis" text,
        "disposition" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clinical_histories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'companies'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_schema = 'public' AND table_name = 'clinical_histories' AND constraint_name = 'FK_clinical_histories_company_id'
        ) THEN
          ALTER TABLE "clinical_histories"
          ADD CONSTRAINT "FK_clinical_histories_company_id"
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'branches'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_schema = 'public' AND table_name = 'clinical_histories' AND constraint_name = 'FK_clinical_histories_branch_id'
        ) THEN
          ALTER TABLE "clinical_histories"
          ADD CONSTRAINT "FK_clinical_histories_branch_id"
          FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'patients'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_schema = 'public' AND table_name = 'clinical_histories' AND constraint_name = 'FK_clinical_histories_patient_id'
        ) THEN
          ALTER TABLE "clinical_histories"
          ADD CONSTRAINT "FK_clinical_histories_patient_id"
          FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "clinical_histories"
      ADD COLUMN IF NOT EXISTS "previous_od_vl" character varying,
      ADD COLUMN IF NOT EXISTS "previous_od_vp" character varying,
      ADD COLUMN IF NOT EXISTS "previous_oi_vl" character varying,
      ADD COLUMN IF NOT EXISTS "previous_oi_vp" character varying,
      ADD COLUMN IF NOT EXISTS "previous_ao" character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clinical_histories"
      DROP COLUMN IF EXISTS "previous_ao",
      DROP COLUMN IF EXISTS "previous_oi_vp",
      DROP COLUMN IF EXISTS "previous_oi_vl",
      DROP COLUMN IF EXISTS "previous_od_vp",
      DROP COLUMN IF EXISTS "previous_od_vl";
    `);
  }
}
