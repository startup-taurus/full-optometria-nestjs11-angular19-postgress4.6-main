import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUseridToWhatsappSessions1763492000000
  implements MigrationInterface
{
  name = 'AddUseridToWhatsappSessions1763492000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "whatsapp_sessions"
      ADD COLUMN IF NOT EXISTS "user_id" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_whatsapp_sessions_user_id"
      ON "whatsapp_sessions" ("user_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "whatsapp_sessions"
      DROP CONSTRAINT IF EXISTS "UQ_whatsapp_sessions_company_branch"
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "whatsapp_sessions"
      DROP CONSTRAINT IF EXISTS "UQ_whatsapp_sessions_company_branch_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "whatsapp_sessions"
      ADD CONSTRAINT "UQ_whatsapp_sessions_company_branch"
      UNIQUE ("company_id", "branch_id")
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_whatsapp_sessions_user_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "whatsapp_sessions"
      DROP COLUMN IF EXISTS "user_id"
    `);
  }
}
