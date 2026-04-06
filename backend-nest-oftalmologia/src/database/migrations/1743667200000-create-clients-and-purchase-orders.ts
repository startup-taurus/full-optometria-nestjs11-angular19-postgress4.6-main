import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientsAndPurchaseOrders1743667200000 implements MigrationInterface {
  name = 'CreateClientsAndPurchaseOrders1743667200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "document_number" character varying NOT NULL,
        "patient_id" uuid NOT NULL,
        "company_id" uuid,
        "branch_id" uuid,
        "mobile_phone" character varying,
        "home_phone" character varying,
        "address" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clients_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_clients_patient_id" FOREIGN KEY ("patient_id") REFERENCES "patients"("id"),
        CONSTRAINT "FK_clients_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id"),
        CONSTRAINT "FK_clients_branch_id" FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clients_document_number_company_id" ON "clients" ("document_number", "company_id")
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clients_patient_id" ON "clients" ("patient_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clients_company_id" ON "clients" ("company_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clients_branch_id" ON "clients" ("branch_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_number" integer,
        "client_id" uuid NOT NULL,
        "laboratory_order_id" uuid NOT NULL,
        "company_id" uuid,
        "branch_id" uuid,
        "should_invoice" boolean NOT NULL DEFAULT false,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "total_amount" numeric(12,2),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_purchase_orders_client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id"),
        CONSTRAINT "FK_purchase_orders_laboratory_order_id" FOREIGN KEY ("laboratory_order_id") REFERENCES "laboratory_orders"("id"),
        CONSTRAINT "FK_purchase_orders_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id"),
        CONSTRAINT "FK_purchase_orders_branch_id" FOREIGN KEY ("branch_id") REFERENCES "branches"("id"),
        CONSTRAINT "UQ_purchase_orders_order_number" UNIQUE ("order_number"),
        CONSTRAINT "UQ_purchase_orders_laboratory_order_id" UNIQUE ("laboratory_order_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_order_number" ON "purchase_orders" ("order_number")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_laboratory_order_id" ON "purchase_orders" ("laboratory_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_client_id" ON "purchase_orders" ("client_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_company_id" ON "purchase_orders" ("company_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_status" ON "purchase_orders" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_should_invoice" ON "purchase_orders" ("should_invoice")
    `);

    await queryRunner.query(`
      ALTER TABLE "laboratory_orders" ADD COLUMN IF NOT EXISTS "client_id" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_laboratory_orders_client_id" ON "laboratory_orders" ("client_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_laboratory_orders_client_id'
        ) THEN
          ALTER TABLE "laboratory_orders"
          ADD CONSTRAINT "FK_laboratory_orders_client_id"
          FOREIGN KEY ("client_id") REFERENCES "clients"("id");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "laboratory_orders" DROP CONSTRAINT IF EXISTS "FK_laboratory_orders_client_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_laboratory_orders_client_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "laboratory_orders" DROP COLUMN IF EXISTS "client_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_orders_should_invoice"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_orders_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_orders_company_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_orders_client_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_orders_laboratory_order_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_orders_order_number"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "purchase_orders"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_clients_branch_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_clients_company_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_clients_patient_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_clients_document_number_company_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "clients"
    `);
  }
}
