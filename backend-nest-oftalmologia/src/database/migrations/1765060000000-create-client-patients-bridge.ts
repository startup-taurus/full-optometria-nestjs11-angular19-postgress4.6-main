import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientPatientsBridge1765060000000
  implements MigrationInterface
{
  name = 'CreateClientPatientsBridge1765060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "client_patients" (
        "client_id" uuid NOT NULL,
        "patient_id" uuid NOT NULL,
        CONSTRAINT "PK_client_patients" PRIMARY KEY ("client_id", "patient_id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients')
           AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_client_patients_client_id') THEN
          ALTER TABLE "client_patients"
          ADD CONSTRAINT "FK_client_patients_client_id"
          FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients')
           AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_client_patients_patient_id') THEN
          ALTER TABLE "client_patients"
          ADD CONSTRAINT "FK_client_patients_patient_id"
          FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_client_patients_client_id" ON "client_patients" ("client_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_client_patients_patient_id" ON "client_patients" ("patient_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients')
           AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients') THEN
          INSERT INTO "client_patients" ("client_id", "patient_id")
          SELECT c."id", c."patient_id"
          FROM "clients" c
          WHERE c."patient_id" IS NOT NULL
          ON CONFLICT ("client_id", "patient_id") DO NOTHING;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_client_patients_patient_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_client_patients_client_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "client_patients"
    `);
  }
}
