import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStockTransferAndCodeConstraints1762723000000
  implements MigrationInterface
{
  name = 'AddStockTransferAndCodeConstraints1762723000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'inventory_transfers'
        ) THEN
          CREATE TABLE "inventory_transfers" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "company_id" uuid NULL,
            "source_branch_id" uuid NOT NULL,
            "target_branch_id" uuid NOT NULL,
            "source_product_id" uuid NOT NULL,
            "target_product_id" uuid NOT NULL,
            "source_code" varchar(50) NOT NULL,
            "quantity" integer NOT NULL,
            "note" text NULL,
            "created_by_user_id" uuid NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "chk_inventory_transfers_quantity_positive" CHECK ("quantity" > 0),
            CONSTRAINT "chk_inventory_transfers_branchs_diff" CHECK ("source_branch_id" <> "target_branch_id"),
            CONSTRAINT "fk_inventory_transfers_source_branch" FOREIGN KEY ("source_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT,
            CONSTRAINT "fk_inventory_transfers_target_branch" FOREIGN KEY ("target_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT,
            CONSTRAINT "fk_inventory_transfers_source_product" FOREIGN KEY ("source_product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
            CONSTRAINT "fk_inventory_transfers_target_product" FOREIGN KEY ("target_product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
            CONSTRAINT "fk_inventory_transfers_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
          );
        ELSE
          ALTER TABLE "inventory_transfers"
          ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid NULL;

          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_schema = 'public'
              AND table_name = 'inventory_transfers'
              AND constraint_name = 'fk_inventory_transfers_created_by'
          ) THEN
            ALTER TABLE "inventory_transfers"
            ADD CONSTRAINT "fk_inventory_transfers_created_by"
            FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
          END IF;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_inventory_transfers_company" ON "inventory_transfers" ("company_id");
      CREATE INDEX IF NOT EXISTS "idx_inventory_transfers_source_branch" ON "inventory_transfers" ("source_branch_id");
      CREATE INDEX IF NOT EXISTS "idx_inventory_transfers_target_branch" ON "inventory_transfers" ("target_branch_id");
      CREATE INDEX IF NOT EXISTS "idx_inventory_transfers_source_product" ON "inventory_transfers" ("source_product_id");
      CREATE INDEX IF NOT EXISTS "idx_inventory_transfers_target_product" ON "inventory_transfers" ("target_product_id");
      CREATE INDEX IF NOT EXISTS "idx_inventory_transfers_created_at" ON "inventory_transfers" ("created_at");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'stock_movements'
        ) THEN
          CREATE TABLE "stock_movements" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "company_id" uuid NULL,
            "branch_id" uuid NOT NULL,
            "product_id" uuid NOT NULL,
            "movement_type" varchar(50) NOT NULL,
            "quantity" integer NOT NULL,
            "balance_after" integer NOT NULL,
            "reference_type" varchar(50) NULL,
            "reference_id" uuid NULL,
            "note" text NULL,
            "created_by_user_id" uuid NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "chk_stock_movements_quantity_positive" CHECK ("quantity" > 0),
            CONSTRAINT "fk_stock_movements_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT,
            CONSTRAINT "fk_stock_movements_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
            CONSTRAINT "fk_stock_movements_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
          );
        ELSE
          ALTER TABLE "stock_movements"
          ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid NULL;

          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_schema = 'public'
              AND table_name = 'stock_movements'
              AND constraint_name = 'fk_stock_movements_created_by'
          ) THEN
            ALTER TABLE "stock_movements"
            ADD CONSTRAINT "fk_stock_movements_created_by"
            FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
          END IF;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_stock_movements_company" ON "stock_movements" ("company_id");
      CREATE INDEX IF NOT EXISTS "idx_stock_movements_branch" ON "stock_movements" ("branch_id");
      CREATE INDEX IF NOT EXISTS "idx_stock_movements_product" ON "stock_movements" ("product_id");
      CREATE INDEX IF NOT EXISTS "idx_stock_movements_type" ON "stock_movements" ("movement_type");
      CREATE INDEX IF NOT EXISTS "idx_stock_movements_created_at" ON "stock_movements" ("created_at");
      CREATE INDEX IF NOT EXISTS "idx_stock_movements_reference" ON "stock_movements" ("reference_type", "reference_id");
    `);

    await queryRunner.query(`
      DO $$
      DECLARE duplicate_count integer;
      BEGIN
        SELECT COUNT(*) INTO duplicate_count
        FROM (
          SELECT branch_id, code
          FROM products
          GROUP BY branch_id, code
          HAVING COUNT(*) > 1
        ) duplicates;

        IF duplicate_count = 0 THEN
          CREATE UNIQUE INDEX IF NOT EXISTS "ux_products_branch_code" ON "products" ("branch_id", "code");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "ux_products_branch_code";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stock_movements_reference";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stock_movements_created_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stock_movements_type";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stock_movements_product";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stock_movements_branch";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_stock_movements_company";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_movements";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inventory_transfers_created_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inventory_transfers_target_product";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inventory_transfers_source_product";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inventory_transfers_target_branch";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inventory_transfers_source_branch";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_inventory_transfers_company";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_transfers";`);
  }
}
