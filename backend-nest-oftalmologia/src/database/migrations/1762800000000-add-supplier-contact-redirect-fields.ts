import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplierContactRedirectFields1762800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'suppliers'
        ) THEN
          ALTER TABLE "suppliers"
          ADD COLUMN IF NOT EXISTS "website" character varying(255),
          ADD COLUMN IF NOT EXISTS "address" character varying(255),
          ADD COLUMN IF NOT EXISTS "notes" text;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'suppliers'
        ) THEN
          ALTER TABLE "suppliers"
          DROP COLUMN IF EXISTS "website",
          DROP COLUMN IF EXISTS "address",
          DROP COLUMN IF EXISTS "notes";
        END IF;
      END
      $$;
    `);
  }
}
