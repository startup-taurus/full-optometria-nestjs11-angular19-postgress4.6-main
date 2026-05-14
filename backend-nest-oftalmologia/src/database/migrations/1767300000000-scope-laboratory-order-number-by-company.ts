import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScopeLaboratoryOrderNumberByCompany1767300000000
  implements MigrationInterface
{
  name = 'ScopeLaboratoryOrderNumberByCompany1767300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        idx RECORD;
        cons_name TEXT;
      BEGIN
        FOR idx IN
          SELECT i.relname AS index_name, x.indexrelid AS index_oid
          FROM pg_index x
          JOIN pg_class i ON i.oid = x.indexrelid
          JOIN pg_class t ON t.oid = x.indrelid
          WHERE t.relname = 'laboratory_orders'
            AND x.indisunique = true
            AND x.indpred IS NULL
            AND array_length(x.indkey, 1) = 1
            AND (
              SELECT attname FROM pg_attribute
              WHERE attrelid = t.oid AND attnum = x.indkey[0]
            ) = 'order_number'
        LOOP
          SELECT conname INTO cons_name
          FROM pg_constraint
          WHERE conindid = idx.index_oid;

          IF cons_name IS NOT NULL THEN
            EXECUTE format(
              'ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',
              'laboratory_orders',
              cons_name
            );
          ELSE
            EXECUTE format('DROP INDEX IF EXISTS %I', idx.index_name);
          END IF;
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`
      UPDATE "laboratory_orders" AS lo
      SET "order_number" = sub.new_number
      FROM (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY company_id
            ORDER BY created_at ASC, id ASC
          ) AS new_number
        FROM "laboratory_orders"
      ) AS sub
      WHERE lo.id = sub.id
        AND lo."order_number" IS DISTINCT FROM sub.new_number;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_laboratory_orders_company_order_number"
      ON "laboratory_orders" ("company_id", "order_number")
      WHERE "company_id" IS NOT NULL AND "order_number" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_laboratory_orders_null_company_order_number"
      ON "laboratory_orders" ("order_number")
      WHERE "company_id" IS NULL AND "order_number" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_laboratory_orders_null_company_order_number";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_laboratory_orders_company_order_number";
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_laboratory_orders_order_number'
        ) THEN
          ALTER TABLE "laboratory_orders"
          ADD CONSTRAINT "UQ_laboratory_orders_order_number" UNIQUE ("order_number");
        END IF;
      END $$;
    `);
  }
}
