import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingConfigToBranches1766300000001 implements MigrationInterface {
  name = 'AddBillingConfigToBranches1766300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'branches'
        ) THEN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'branches'
              AND column_name = 'establishment_code'
          ) THEN
            ALTER TABLE "branches" ADD COLUMN "establishment_code" character varying(3);
          END IF;

          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'branches'
              AND column_name = 'emission_point_code'
          ) THEN
            ALTER TABLE "branches" ADD COLUMN "emission_point_code" character varying(3);
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
            AND table_name = 'branches'
        ) THEN
          IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'branches'
              AND column_name = 'establishment_code'
          ) THEN
            ALTER TABLE "branches" DROP COLUMN "establishment_code";
          END IF;

          IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'branches'
              AND column_name = 'emission_point_code'
          ) THEN
            ALTER TABLE "branches" DROP COLUMN "emission_point_code";
          END IF;
        END IF;
      END $$;
    `);
  }
}