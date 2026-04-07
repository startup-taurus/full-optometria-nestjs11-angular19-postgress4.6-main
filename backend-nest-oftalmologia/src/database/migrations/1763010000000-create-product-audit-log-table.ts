import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductAuditLogTable1763010000000 implements MigrationInterface {
  name = 'CreateProductAuditLogTable1763010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NULL,
        "branch_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "event_type" character varying(30) NOT NULL,
        "changed_fields" jsonb NULL,
        "metadata" jsonb NULL,
        "created_by_user_id" uuid NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_audit_log" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products')
           AND NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'product_audit_log' AND constraint_name = 'FK_product_audit_log_product') THEN
          ALTER TABLE "product_audit_log"
          ADD CONSTRAINT "FK_product_audit_log_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'product_audit_log'
        ) THEN
          IF NOT EXISTS (
            SELECT FROM pg_indexes
            WHERE tablename = 'product_audit_log'
              AND indexname = 'IDX_product_audit_log_product_branch'
          ) THEN
            CREATE INDEX "IDX_product_audit_log_product_branch"
              ON "product_audit_log" ("product_id", "branch_id");
          END IF;

          IF NOT EXISTS (
            SELECT FROM pg_indexes
            WHERE tablename = 'product_audit_log'
              AND indexname = 'IDX_product_audit_log_created_at'
          ) THEN
            CREATE INDEX "IDX_product_audit_log_created_at"
              ON "product_audit_log" ("created_at" DESC);
          END IF;

          IF NOT EXISTS (
            SELECT FROM pg_indexes
            WHERE tablename = 'product_audit_log'
              AND indexname = 'IDX_product_audit_log_event_type'
          ) THEN
            CREATE INDEX "IDX_product_audit_log_event_type"
              ON "product_audit_log" ("event_type");
          END IF;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'product_audit_log'
        ) THEN
          DROP TABLE "product_audit_log";
        END IF;
      END $$;
    `);
  }
}
