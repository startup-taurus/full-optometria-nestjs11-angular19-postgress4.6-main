import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyPlanLimits1762473000000 implements MigrationInterface {
  name = 'AddCompanyPlanLimits1762473000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'companies'
        ) THEN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'companies'
              AND column_name = 'max_users'
          ) THEN
            ALTER TABLE "companies" ADD COLUMN "max_users" INTEGER DEFAULT NULL;
          END IF;

          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'companies'
              AND column_name = 'max_branches'
          ) THEN
            ALTER TABLE "companies" ADD COLUMN "max_branches" INTEGER DEFAULT NULL;
          END IF;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'companies'
        ) THEN
          IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'companies'
              AND column_name = 'max_users'
          ) THEN
            ALTER TABLE "companies" DROP COLUMN "max_users";
          END IF;

          IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'companies'
              AND column_name = 'max_branches'
          ) THEN
            ALTER TABLE "companies" DROP COLUMN "max_branches";
          END IF;
        END IF;
      END $$;
    `);
  }
}
