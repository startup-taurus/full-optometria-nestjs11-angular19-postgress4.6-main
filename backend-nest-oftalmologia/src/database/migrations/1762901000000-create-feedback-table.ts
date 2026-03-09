import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedbackTable1762901000000 implements MigrationInterface {
  name = 'CreateFeedbackTable1762901000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'feedback'
        ) THEN
          CREATE TABLE "feedback" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "company_id" uuid NOT NULL,
            "branch_id" uuid,
            "created_by_user_id" uuid NOT NULL,
            "type" character varying(20) NOT NULL,
            "status" character varying(20) NOT NULL DEFAULT 'nuevo',
            "title" character varying(180) NOT NULL,
            "description" text NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_feedback" PRIMARY KEY ("id")
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'feedback'
        ) THEN
          IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints
            WHERE constraint_name = 'CHK_feedback_type'
              AND table_name = 'feedback'
          ) THEN
            ALTER TABLE "feedback"
            ADD CONSTRAINT "CHK_feedback_type"
            CHECK ("type" IN ('suggestion', 'report'));
          END IF;

          IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints
            WHERE constraint_name = 'CHK_feedback_status'
              AND table_name = 'feedback'
          ) THEN
            ALTER TABLE "feedback"
            ADD CONSTRAINT "CHK_feedback_status"
            CHECK ("status" IN ('nuevo', 'en_revision', 'resuelto'));
          END IF;
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_feedback_company_id" ON "feedback" ("company_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_feedback_branch_id" ON "feedback" ("branch_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_feedback_created_by_user_id" ON "feedback" ("created_by_user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_feedback_status" ON "feedback" ("status")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_feedback_type" ON "feedback" ("type")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_feedback_company_created" ON "feedback" ("company_id", "created_at")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_feedback_branch_created" ON "feedback" ("branch_id", "created_at")`
    );

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'feedback'
        ) THEN
          IF EXISTS (
            SELECT FROM information_schema.table_constraints
            WHERE constraint_name = 'CHK_feedback_status'
              AND table_name = 'feedback'
          ) THEN
            ALTER TABLE "feedback" DROP CONSTRAINT "CHK_feedback_status";
          END IF;

          IF EXISTS (
            SELECT FROM information_schema.table_constraints
            WHERE constraint_name = 'CHK_feedback_type'
              AND table_name = 'feedback'
          ) THEN
            ALTER TABLE "feedback" DROP CONSTRAINT "CHK_feedback_type";
          END IF;
        END IF;
      END $$;
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_branch_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_company_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_created_by_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_branch_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feedback_company_id"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "feedback"`);
  }
}
