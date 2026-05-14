import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseOrderInvoiceTables1766203000000 implements MigrationInterface {
  name = 'CreatePurchaseOrderInvoiceTables1766203000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "billing_payment_methods" (
        "code" character varying(4) NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_billing_payment_methods_code" PRIMARY KEY ("code")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "billing_payment_methods" ("code", "name", "description", "is_active")
      VALUES
        ('01', 'Efectivo', 'Sin utilizacion del sistema financiero', true),
        ('16', 'Tarjeta debito', 'Tarjeta de debito', true),
        ('19', 'Tarjeta credito', 'Tarjeta de credito', true),
        ('20', 'Transferencia o cheque', 'Otros con utilizacion del sistema financiero', true)
      ON CONFLICT ("code")
      DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "is_active" = EXCLUDED."is_active",
        "updated_at" = now()
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_order_invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "purchase_order_id" uuid NOT NULL,
        "company_id" uuid,
        "branch_id" uuid,
        "external_invoice_id" character varying(120),
        "invoice_number" character varying(80),
        "access_key" character varying(120),
        "state" character varying(32) NOT NULL DEFAULT 'NEW',
        "payment_method" character varying(4) NOT NULL,
        "tax_percent" smallint NOT NULL,
        "subtotal" numeric(12,2) NOT NULL DEFAULT 0,
        "tax_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "total_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "xml_base64" text,
        "authorization_number" character varying(150),
        "authorization_date" TIMESTAMP WITH TIME ZONE,
        "error_message" text,
        "last_request_payload" jsonb,
        "last_response_payload" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_order_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_purchase_order_invoices_purchase_order_id" UNIQUE ("purchase_order_id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'purchase_orders'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_purchase_order_invoices_purchase_order_id'
        ) THEN
          ALTER TABLE "purchase_order_invoices"
          ADD CONSTRAINT "FK_purchase_order_invoices_purchase_order_id"
          FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'companies'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_purchase_order_invoices_company_id'
        ) THEN
          ALTER TABLE "purchase_order_invoices"
          ADD CONSTRAINT "FK_purchase_order_invoices_company_id"
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'branches'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_purchase_order_invoices_branch_id'
        ) THEN
          ALTER TABLE "purchase_order_invoices"
          ADD CONSTRAINT "FK_purchase_order_invoices_branch_id"
          FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_order_invoices_company_id" ON "purchase_order_invoices" ("company_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_order_invoices_branch_id" ON "purchase_order_invoices" ("branch_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_order_invoices_state" ON "purchase_order_invoices" ("state")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_order_invoices_access_key" ON "purchase_order_invoices" ("access_key")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_order_invoice_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoice_id" uuid NOT NULL,
        "purchase_order_id" uuid,
        "action" character varying(24) NOT NULL,
        "status_code" integer,
        "request_payload" jsonb,
        "response_payload" jsonb,
        "error_message" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_order_invoice_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'purchase_order_invoices'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_purchase_order_invoice_logs_invoice_id'
        ) THEN
          ALTER TABLE "purchase_order_invoice_logs"
          ADD CONSTRAINT "FK_purchase_order_invoice_logs_invoice_id"
          FOREIGN KEY ("invoice_id") REFERENCES "purchase_order_invoices"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_order_invoice_logs_invoice_id" ON "purchase_order_invoice_logs" ("invoice_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_order_invoice_logs_purchase_order_id" ON "purchase_order_invoice_logs" ("purchase_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_order_invoice_logs_action" ON "purchase_order_invoice_logs" ("action")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_order_invoice_logs_action"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_order_invoice_logs_purchase_order_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_order_invoice_logs_invoice_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "purchase_order_invoice_logs"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_order_invoices_access_key"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_order_invoices_state"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_order_invoices_branch_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_order_invoices_company_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "purchase_order_invoices"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "billing_payment_methods"
    `);
  }
}
