import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowNullPatientIdOnClients1765054000000
  implements MigrationInterface
{
  name = 'AllowNullPatientIdOnClients1765054000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'clients'
            AND column_name = 'patient_id'
            AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE "clients" ALTER COLUMN "patient_id" DROP NOT NULL;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "clients" WHERE "patient_id" IS NULL;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'clients'
            AND column_name = 'patient_id'
            AND is_nullable = 'YES'
        ) THEN
          ALTER TABLE "clients" ALTER COLUMN "patient_id" SET NOT NULL;
        END IF;
      END$$;
    `);
  }
}
