import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowNullEmailDocumentOnPatients1767000000000
  implements MigrationInterface
{
  name = 'AllowNullEmailDocumentOnPatients1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'patients'
            AND column_name = 'email'
            AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE "patients" ALTER COLUMN "email" DROP NOT NULL;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'patients'
            AND column_name = 'document_number'
            AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE "patients" ALTER COLUMN "document_number" DROP NOT NULL;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "patients"
      SET "email" = CONCAT('restored-null-email-', "id", '@local.invalid')
      WHERE "email" IS NULL;
    `);

    await queryRunner.query(`
      UPDATE "patients"
      SET "document_number" = CONCAT('restored-null-doc-', REPLACE("id"::text, '-', ''))
      WHERE "document_number" IS NULL;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'patients'
            AND column_name = 'email'
            AND is_nullable = 'YES'
        ) THEN
          ALTER TABLE "patients" ALTER COLUMN "email" SET NOT NULL;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'patients'
            AND column_name = 'document_number'
            AND is_nullable = 'YES'
        ) THEN
          ALTER TABLE "patients" ALTER COLUMN "document_number" SET NOT NULL;
        END IF;
      END$$;
    `);
  }
}
