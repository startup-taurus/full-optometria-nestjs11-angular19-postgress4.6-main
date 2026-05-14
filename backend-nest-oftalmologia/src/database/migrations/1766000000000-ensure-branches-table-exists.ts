import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureBranchesTableExists1766000000000
  implements MigrationInterface
{
  name = 'EnsureBranchesTableExists1766000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "branches" (
        "id" uuid NOT NULL,
        "company_id" uuid,
        "name" character varying NOT NULL,
        "code" character varying NOT NULL,
        "address" character varying NOT NULL,
        "city" character varying NOT NULL,
        "phone" character varying,
        "corporate_email" character varying,
        "opening_hours" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_06583786d73e7325630a0278ff5'
        ) THEN
          ALTER TABLE "branches"
          ADD CONSTRAINT "UQ_06583786d73e7325630a0278ff5" UNIQUE ("name", "company_id");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_ac9b742f84958b3238d00ec8b3e'
        ) THEN
          ALTER TABLE "branches"
          ADD CONSTRAINT "UQ_ac9b742f84958b3238d00ec8b3e" UNIQUE ("code", "company_id");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'companies'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_5973f79e64a27c506b07cd84b29'
        ) THEN
          ALTER TABLE "branches"
          ADD CONSTRAINT "FK_5973f79e64a27c506b07cd84b29"
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'branches' AND column_name = 'opening_hours'
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
          FROM pg_constraint
          WHERE conname = 'FK_5973f79e64a27c506b07cd84b29'
        ) THEN
          ALTER TABLE "branches" DROP CONSTRAINT "FK_5973f79e64a27c506b07cd84b29";
        END IF;

        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_ac9b742f84958b3238d00ec8b3e'
        ) THEN
          ALTER TABLE "branches" DROP CONSTRAINT "UQ_ac9b742f84958b3238d00ec8b3e";
        END IF;

        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_06583786d73e7325630a0278ff5'
        ) THEN
          ALTER TABLE "branches" DROP CONSTRAINT "UQ_06583786d73e7325630a0278ff5";
        END IF;
      END $$;
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "branches";`);
  }
}
