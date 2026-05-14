import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScopePurchaseOrderNumberByCompany1766300000000
  implements MigrationInterface
{
  name = 'ScopePurchaseOrderNumberByCompany1766300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "purchase_orders"
      DROP CONSTRAINT IF EXISTS "UQ_purchase_orders_order_number";
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_purchase_orders_company_order_number"
      ON "purchase_orders" ("company_id", "order_number")
      WHERE "company_id" IS NOT NULL AND "order_number" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_purchase_orders_null_company_order_number"
      ON "purchase_orders" ("order_number")
      WHERE "company_id" IS NULL AND "order_number" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_purchase_orders_null_company_order_number";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_purchase_orders_company_order_number";
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_purchase_orders_order_number'
        ) THEN
          ALTER TABLE "purchase_orders"
          ADD CONSTRAINT "UQ_purchase_orders_order_number" UNIQUE ("order_number");
        END IF;
      END $$;
    `);
  }
}
