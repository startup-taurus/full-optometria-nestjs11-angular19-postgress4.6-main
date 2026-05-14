import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductDiscountTable1762903000000 implements MigrationInterface {
  name = 'CreateProductDiscountTable1762903000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_discount" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "product_id" uuid NOT NULL,
        "branch_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "discount_type" character varying(20) NOT NULL,
        "discount_value" numeric(10,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "start_date" timestamp NULL,
        "end_date" timestamp NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_discount" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products')
           AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'product_discount' AND constraint_name = 'FK_product_discount_product') THEN
          ALTER TABLE "product_discount"
          ADD CONSTRAINT "FK_product_discount_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branches')
           AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'product_discount' AND constraint_name = 'FK_product_discount_branch') THEN
          ALTER TABLE "product_discount"
          ADD CONSTRAINT "FK_product_discount_branch" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies')
           AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'product_discount' AND constraint_name = 'FK_product_discount_company') THEN
          ALTER TABLE "product_discount"
          ADD CONSTRAINT "FK_product_discount_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'product_discount'
        ) THEN
          IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints
            WHERE constraint_name = 'UNQ_product_discount_product_branch'
              AND table_name = 'product_discount'
          ) THEN
            ALTER TABLE "product_discount"
            ADD CONSTRAINT "UNQ_product_discount_product_branch" UNIQUE ("product_id", "branch_id");
          END IF;

          IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints
            WHERE constraint_name = 'CHK_discount_type'
              AND table_name = 'product_discount'
          ) THEN
            ALTER TABLE "product_discount"
            ADD CONSTRAINT "CHK_discount_type"
            CHECK ("discount_type" IN ('PERCENTAGE', 'FIXED_AMOUNT'));
          END IF;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_discount_product_id" ON "product_discount" ("product_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_discount_branch_id" ON "product_discount" ("branch_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_discount_company_id" ON "product_discount" ("company_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_discount_is_active" ON "product_discount" ("is_active")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_discount_product_active" ON "product_discount" ("product_id", "is_active")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_product_discount_branch_active" ON "product_discount" ("branch_id", "is_active")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'product_discount'
        ) THEN
          DROP TABLE IF EXISTS "product_discount" CASCADE;
        END IF;
      END $$;
    `);
  }
}
