import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionTables1767500000000
  implements MigrationInterface
{
  name = 'CreateSubscriptionTables1767500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "name" character varying(120) NOT NULL,
        "description" text,
        "amount_cents" integer NOT NULL DEFAULT 0,
        "currency" character varying(8) NOT NULL DEFAULT 'USD',
        "billing_cycle" character varying(20) NOT NULL DEFAULT 'monthly',
        "max_users" integer,
        "max_branches" integer,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plans" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plans_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "plans" (
        "code", "name", "description", "amount_cents", "currency",
        "billing_cycle", "max_users", "max_branches", "is_active"
      )
      VALUES (
        'unico',
        'Plan Unico',
        'Suscripcion mensual a Dioptrika',
        3450,
        'USD',
        'monthly',
        NULL,
        NULL,
        true
      )
      ON CONFLICT ("code")
      DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "amount_cents" = EXCLUDED."amount_cents",
        "currency" = EXCLUDED."currency",
        "billing_cycle" = EXCLUDED."billing_cycle",
        "is_active" = true,
        "updated_at" = now()
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "plan_id" uuid,
        "plan_code" character varying(50),
        "external_subscription_id" character varying(120),
        "status" character varying(32) NOT NULL DEFAULT 'active',
        "billing_cycle" character varying(20),
        "amount_cents" integer,
        "currency" character varying(8),
        "card_brand" character varying(40),
        "card_last4" character varying(4),
        "current_period_end" TIMESTAMP WITH TIME ZONE,
        "started_at" TIMESTAMP WITH TIME ZONE,
        "canceled_at" TIMESTAMP WITH TIME ZONE,
        "last_synced_at" TIMESTAMP WITH TIME ZONE,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_company_subscriptions_company_id" UNIQUE ("company_id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'companies'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_company_subscriptions_company_id'
        ) THEN
          ALTER TABLE "company_subscriptions"
          ADD CONSTRAINT "FK_company_subscriptions_company_id"
          FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'plans'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_company_subscriptions_plan_id'
        ) THEN
          ALTER TABLE "company_subscriptions"
          ADD CONSTRAINT "FK_company_subscriptions_plan_id"
          FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_company_subscriptions_external_id"
      ON "company_subscriptions" ("external_subscription_id")
      WHERE "external_subscription_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_company_subscriptions_company_id"
      ON "company_subscriptions" ("company_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_company_subscriptions_status"
      ON "company_subscriptions" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_company_subscriptions_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_company_subscriptions_company_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_company_subscriptions_external_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "company_subscriptions"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "plans"
    `);
  }
}
