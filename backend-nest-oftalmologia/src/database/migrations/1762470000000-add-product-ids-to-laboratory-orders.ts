import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductIdsToLaboratoryOrders1762470000000
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
          ADD COLUMN IF NOT EXISTS "product_ids" uuid[];

          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'laboratory_orders'
              AND column_name = 'product_id'
          ) THEN
            UPDATE "laboratory_orders"
            SET "product_ids" = ARRAY["product_id"]::uuid[]
            WHERE "product_id" IS NOT NULL
              AND ("product_ids" IS NULL OR cardinality("product_ids") = 0);
          END IF;
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
          ALTER TABLE "laboratory_orders"
          DROP COLUMN IF EXISTS "product_ids";
        END IF;
      END
      $$;
    `);
  }
}
