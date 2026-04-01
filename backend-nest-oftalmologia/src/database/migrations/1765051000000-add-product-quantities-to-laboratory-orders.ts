import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductQuantitiesToLaboratoryOrders1765051000000
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
          ADD COLUMN IF NOT EXISTS "product_quantities" jsonb;
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
          DROP COLUMN IF EXISTS "product_quantities";
        END IF;
      END
      $$;
    `);
  }
}
