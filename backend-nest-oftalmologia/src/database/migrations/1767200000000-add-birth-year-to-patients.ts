import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBirthYearToPatients1767200000000
  implements MigrationInterface
{
  name = 'AddBirthYearToPatients1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'patients'
            AND column_name = 'birth_year'
        ) THEN
          ALTER TABLE "patients" ADD COLUMN "birth_year" SMALLINT NULL;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'patients'
            AND column_name = 'birth_year'
        ) THEN
          ALTER TABLE "patients" DROP COLUMN "birth_year";
        END IF;
      END$$;
    `);
  }
}
