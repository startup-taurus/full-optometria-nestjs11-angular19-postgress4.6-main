import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureUsersBranchIdColumn1766001000000
  implements MigrationInterface
{
  name = 'EnsureUsersBranchIdColumn1766001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "branch_id" uuid;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_7ae6334059289559722437bcc1c"
      ON "users" ("branch_id");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'branches'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_7ae6334059289559722437bcc1c'
        ) THEN
          ALTER TABLE "users"
          ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c"
          FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_7ae6334059289559722437bcc1c'
        ) THEN
          ALTER TABLE "users" DROP CONSTRAINT "FK_7ae6334059289559722437bcc1c";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_7ae6334059289559722437bcc1c";
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "branch_id";
    `);
  }
}
