import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterBranchOpeningHoursToText1762575000000
  implements MigrationInterface
{
  name = 'AlterBranchOpeningHoursToText1762575000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'branches'
            AND column_name = 'opening_hours'
            AND data_type <> 'text'
        ) THEN
          ALTER TABLE "branches"
          ALTER COLUMN "opening_hours" TYPE text;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'branches'
            AND column_name = 'opening_hours'
            AND data_type = 'text'
        ) THEN
          ALTER TABLE "branches"
          ALTER COLUMN "opening_hours" TYPE character varying(255);
        END IF;
      END $$;
    `);
  }
}
