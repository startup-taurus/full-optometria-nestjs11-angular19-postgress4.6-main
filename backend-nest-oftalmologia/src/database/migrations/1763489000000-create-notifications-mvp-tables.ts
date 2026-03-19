import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsMvpTables1763489000000
  implements MigrationInterface
{
  name = 'CreateNotificationsMvpTables1763489000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "whatsapp_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid,
        "branch_id" uuid,
        "user_id" uuid,
        "session_key" character varying NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'disconnected',
        "qr_code" text,
        "connected_phone" character varying,
        "last_connected_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_whatsapp_sessions_session_key" UNIQUE ("session_key"),
        CONSTRAINT "UQ_whatsapp_sessions_company_branch_user" UNIQUE ("company_id", "branch_id", "user_id"),
        CONSTRAINT "PK_whatsapp_sessions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reminder_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid,
        "branch_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "appointment_reminder_hours_before" integer NOT NULL DEFAULT 24,
        "renewal_after_days" integer NOT NULL DEFAULT 365,
        "renewal_notify_before_days" integer NOT NULL DEFAULT 15,
        "quiet_hours_start" character varying NOT NULL DEFAULT '21:00',
        "quiet_hours_end" character varying NOT NULL DEFAULT '08:00',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_reminder_rules_company_branch" UNIQUE ("company_id", "branch_id"),
        CONSTRAINT "PK_reminder_rules" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_campaigns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid,
        "branch_id" uuid,
        "name" character varying(120) NOT NULL,
        "type" character varying(20) NOT NULL DEFAULT 'reminder',
        "status" character varying(20) NOT NULL DEFAULT 'draft',
        "message_template" text NOT NULL,
        "scheduled_at" TIMESTAMP,
        "processed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_campaigns" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "message_dispatch_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid,
        "branch_id" uuid,
        "patient_id" uuid NOT NULL,
        "campaign_id" uuid,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "channel" character varying(24) NOT NULL,
        "phone" character varying(30) NOT NULL,
        "message" text NOT NULL,
        "scheduled_at" TIMESTAMP,
        "sent_at" TIMESTAMP,
        "provider_message_id" character varying,
        "error_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_message_dispatch_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "patient_contact_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid,
        "branch_id" uuid,
        "patient_id" uuid NOT NULL,
        "preferred_phone" character varying,
        "whatsapp_opt_in" boolean NOT NULL DEFAULT false,
        "promotions_opt_in" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_patient_contact_preferences_scope" UNIQUE ("company_id", "branch_id", "patient_id"),
        CONSTRAINT "PK_patient_contact_preferences" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_whatsapp_sessions_company_id" ON "whatsapp_sessions" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_whatsapp_sessions_branch_id" ON "whatsapp_sessions" ("branch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_whatsapp_sessions_status" ON "whatsapp_sessions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_whatsapp_sessions_user_id" ON "whatsapp_sessions" ("user_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reminder_rules_company_id" ON "reminder_rules" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reminder_rules_branch_id" ON "reminder_rules" ("branch_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_campaigns_company_id" ON "notification_campaigns" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_campaigns_branch_id" ON "notification_campaigns" ("branch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_campaigns_status" ON "notification_campaigns" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notification_campaigns_scheduled_at" ON "notification_campaigns" ("scheduled_at")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_message_dispatch_logs_company_id" ON "message_dispatch_logs" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_message_dispatch_logs_branch_id" ON "message_dispatch_logs" ("branch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_message_dispatch_logs_patient_id" ON "message_dispatch_logs" ("patient_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_message_dispatch_logs_status" ON "message_dispatch_logs" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_message_dispatch_logs_scheduled_at" ON "message_dispatch_logs" ("scheduled_at")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_patient_contact_preferences_company_id" ON "patient_contact_preferences" ("company_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_patient_contact_preferences_branch_id" ON "patient_contact_preferences" ("branch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_patient_contact_preferences_patient_id" ON "patient_contact_preferences" ("patient_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_patient_contact_preferences_patient_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_patient_contact_preferences_branch_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_patient_contact_preferences_company_id"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_message_dispatch_logs_scheduled_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_message_dispatch_logs_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_message_dispatch_logs_patient_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_message_dispatch_logs_branch_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_message_dispatch_logs_company_id"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notification_campaigns_scheduled_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notification_campaigns_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notification_campaigns_branch_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notification_campaigns_company_id"`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reminder_rules_branch_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reminder_rules_company_id"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_whatsapp_sessions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_whatsapp_sessions_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_whatsapp_sessions_branch_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_whatsapp_sessions_company_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "patient_contact_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "message_dispatch_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_campaigns"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reminder_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "whatsapp_sessions"`);
  }
}
