import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByUserToShiftsAndLabOrders1766101000000
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
            AND table_name = 'shifts'
        ) THEN
          ALTER TABLE "shifts"
          ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid;

          CREATE INDEX IF NOT EXISTS "IDX_shifts_created_by_user_id"
            ON "shifts" ("created_by_user_id");
        END IF;
      END
      $$;
    `);

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
          ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid;

          CREATE INDEX IF NOT EXISTS "IDX_laboratory_orders_created_by_user_id"
            ON "laboratory_orders" ("created_by_user_id");
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
          DROP INDEX IF EXISTS "IDX_laboratory_orders_created_by_user_id";
          ALTER TABLE "laboratory_orders"
          DROP COLUMN IF EXISTS "created_by_user_id";
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'shifts'
        ) THEN
          DROP INDEX IF EXISTS "IDX_shifts_created_by_user_id";
          ALTER TABLE "shifts"
          DROP COLUMN IF EXISTS "created_by_user_id";
        END IF;
      END
      $$;
    `);
  }
}
