import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsPerfIndexes1767100000000
  implements MigrationInterface
{
  name = 'AddNotificationsPerfIndexes1767100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_shifts_branch_user_appointment"
      ON "shifts" ("branch_id", "created_by_user_id", "appointment_date")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dispatch_logs_branch_status_sentat"
      ON "message_dispatch_logs" ("branch_id", "status", "sent_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_dispatch_logs_branch_patient_scheduled"
      ON "message_dispatch_logs" ("branch_id", "patient_id", "scheduled_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_dispatch_logs_branch_patient_scheduled"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_dispatch_logs_branch_status_sentat"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_shifts_branch_user_appointment"`,
    );
  }
}
