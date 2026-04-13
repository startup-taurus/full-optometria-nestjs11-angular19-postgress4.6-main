import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingConfigToCompanies1766202000000 implements MigrationInterface {
  name = 'AddBillingConfigToCompanies1766202000000';

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
              AND column_name = 'billing_api_key'
          ) THEN
            ALTER TABLE "companies" ADD COLUMN "billing_api_key" character varying(255);
          END IF;

          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'companies'
              AND column_name = 'billing_contributor_id'
          ) THEN
            ALTER TABLE "companies" ADD COLUMN "billing_contributor_id" integer DEFAULT NULL;
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
              AND column_name = 'billing_api_key'
          ) THEN
            ALTER TABLE "companies" DROP COLUMN "billing_api_key";
          END IF;

          IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'companies'
              AND column_name = 'billing_contributor_id'
          ) THEN
            ALTER TABLE "companies" DROP COLUMN "billing_contributor_id";
          END IF;
        END IF;
      END $$;
    `);
  }
}
