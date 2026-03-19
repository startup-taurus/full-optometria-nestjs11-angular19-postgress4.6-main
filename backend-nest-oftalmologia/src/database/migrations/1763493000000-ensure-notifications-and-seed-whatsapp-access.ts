import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureNotificationsAndSeedWhatsappAccess1763493000000
  implements MigrationInterface
{
  name = 'EnsureNotificationsAndSeedWhatsappAccess1763493000000';

  private readonly moduleId = '248bccd0-7d98-4e46-80df-11d8d22102eb';
  private readonly permissionId = '772ddd04-70cf-4d3c-b4a3-c30b18bf8505';

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
        CONSTRAINT "PK_whatsapp_sessions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "whatsapp_sessions"
      ADD COLUMN IF NOT EXISTS "user_id" uuid
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
        CONSTRAINT "PK_patient_contact_preferences" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_whatsapp_sessions_session_key'
        ) THEN
          ALTER TABLE "whatsapp_sessions"
          ADD CONSTRAINT "UQ_whatsapp_sessions_session_key" UNIQUE ("session_key");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_whatsapp_sessions_company_branch_user'
        ) THEN
          ALTER TABLE "whatsapp_sessions"
          ADD CONSTRAINT "UQ_whatsapp_sessions_company_branch_user"
          UNIQUE ("company_id", "branch_id", "user_id");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_reminder_rules_company_branch'
        ) THEN
          ALTER TABLE "reminder_rules"
          ADD CONSTRAINT "UQ_reminder_rules_company_branch"
          UNIQUE ("company_id", "branch_id");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_patient_contact_preferences_scope'
        ) THEN
          ALTER TABLE "patient_contact_preferences"
          ADD CONSTRAINT "UQ_patient_contact_preferences_scope"
          UNIQUE ("company_id", "branch_id", "patient_id");
        END IF;
      END $$;
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

    await queryRunner.query(`
      INSERT INTO "modules" ("id", "module_name", "description", "is_active")
      VALUES (
        '${this.moduleId}',
        'WhatsApp',
        'modulo que envia mensajes por WhatsApp a los pacientes',
        true
      )
      ON CONFLICT ("id") DO UPDATE SET
        "module_name" = EXCLUDED."module_name",
        "description" = EXCLUDED."description",
        "is_active" = true
    `);

    await queryRunner.query(`
      INSERT INTO "modules" ("id", "module_name", "description", "is_active")
      VALUES (
        '${this.moduleId}',
        'WhatsApp',
        'modulo que envia mensajes por WhatsApp a los pacientes',
        true
      )
      ON CONFLICT ("module_name") DO UPDATE SET
        "description" = EXCLUDED."description",
        "is_active" = true
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "permission_name", "description", "is_active", "module_id")
      VALUES (
        '${this.permissionId}',
        'Ver Modulo de WhatsApp',
        'Este permiso permite ver y ocultar el modulo para enviar mensajes por whatsapp',
        true,
        (SELECT m.id FROM "modules" m WHERE m."module_name" = 'WhatsApp' LIMIT 1)
      )
      ON CONFLICT ("id") DO UPDATE SET
        "permission_name" = EXCLUDED."permission_name",
        "description" = EXCLUDED."description",
        "is_active" = true,
        "module_id" = EXCLUDED."module_id"
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id", "is_enabled")
      SELECT r.id, p.id, true
      FROM "roles" r
      CROSS JOIN LATERAL (
        SELECT id
        FROM "permissions"
        WHERE "id" = '${this.permissionId}'
           OR "permission_name" = 'Ver Modulo de WhatsApp'
        ORDER BY CASE WHEN "id" = '${this.permissionId}' THEN 0 ELSE 1 END
        LIMIT 1
      ) p
      WHERE r."role_name" = 'SUPER_ADMIN'
      ON CONFLICT ("role_id", "permission_id")
      DO UPDATE SET "is_enabled" = true
    `);

    await queryRunner.query(`
      INSERT INTO "role_modules" ("role_id", "module_id", "is_enabled")
      SELECT r.id, m.id, true
      FROM "roles" r
      CROSS JOIN LATERAL (
        SELECT id
        FROM "modules"
        WHERE "id" = '${this.moduleId}'
           OR "module_name" = 'WhatsApp'
        ORDER BY CASE WHEN "id" = '${this.moduleId}' THEN 0 ELSE 1 END
        LIMIT 1
      ) m
      WHERE r."role_name" = 'SUPER_ADMIN'
      ON CONFLICT ("role_id", "module_id")
      DO UPDATE SET "is_enabled" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" = '${this.permissionId}'
    `);

    await queryRunner.query(`
      DELETE FROM "role_modules"
      WHERE "module_id" = '${this.moduleId}'
    `);

    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "id" = '${this.permissionId}'
    `);

    await queryRunner.query(`
      DELETE FROM "modules"
      WHERE "id" = '${this.moduleId}'
    `);
  }
}
