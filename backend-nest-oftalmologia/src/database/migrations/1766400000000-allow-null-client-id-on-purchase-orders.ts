import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowNullClientIdOnPurchaseOrders1766400000000
  implements MigrationInterface
{
  name = 'AllowNullClientIdOnPurchaseOrders1766400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'purchase_orders'
            AND column_name = 'client_id'
            AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE "purchase_orders"
          ALTER COLUMN "client_id" DROP NOT NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'purchase_orders'
            AND column_name = 'client_id'
            AND is_nullable = 'YES'
        ) THEN
          IF EXISTS (
            SELECT 1
            FROM "purchase_orders"
            WHERE "client_id" IS NULL
          ) THEN
            RAISE EXCEPTION 'Cannot set purchase_orders.client_id back to NOT NULL because NULL values exist';
          END IF;

          ALTER TABLE "purchase_orders"
          ALTER COLUMN "client_id" SET NOT NULL;
        END IF;
      END $$;
    `);
  }
}
