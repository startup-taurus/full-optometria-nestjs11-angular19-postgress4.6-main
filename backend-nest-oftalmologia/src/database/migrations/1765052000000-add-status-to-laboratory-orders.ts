import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToLaboratoryOrders1765052000000
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
            AND table_name = 'laboratory_orders'
        ) THEN
          ALTER TABLE "laboratory_orders"
          ADD COLUMN IF NOT EXISTS "status" character varying(20);

          UPDATE "laboratory_orders"
          SET "status" = CASE
            WHEN "is_confirmed" = true THEN 'received'
            ELSE 'pending'
          END
          WHERE "status" IS NULL OR BTRIM("status") = '';

          ALTER TABLE "laboratory_orders"
          ALTER COLUMN "status" SET DEFAULT 'pending';

          CREATE INDEX IF NOT EXISTS "IDX_laboratory_orders_status"
            ON "laboratory_orders" ("status");
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
            AND table_name = 'laboratory_orders'
        ) THEN
          DROP INDEX IF EXISTS "IDX_laboratory_orders_status";
          ALTER TABLE "laboratory_orders"
          DROP COLUMN IF EXISTS "status";
        END IF;
      END
      $$;
    `);
  }
}