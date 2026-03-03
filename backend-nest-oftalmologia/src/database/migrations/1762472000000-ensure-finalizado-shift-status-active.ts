import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureFinalizadoShiftStatusActive1762472000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'shift_status'
        ) THEN
          UPDATE "shift_status"
          SET
            "is_active" = true,
            "description" = COALESCE("description", 'Turno finalizado'),
            "color" = COALESCE("color", '#0d6efd')
          WHERE LOWER(BTRIM("name")) = LOWER('Finalizado');

          IF NOT EXISTS (
            SELECT 1
            FROM "shift_status"
            WHERE LOWER(BTRIM("name")) = LOWER('Finalizado')
          ) THEN
            INSERT INTO "shift_status" ("name", "description", "color", "is_active")
            VALUES ('Finalizado', 'Turno finalizado', '#0d6efd', true);
          END IF;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'shift_status'
        ) THEN
          IF EXISTS (
            SELECT 1
            FROM "shift_status" ss
            WHERE LOWER(BTRIM(ss.name)) = LOWER('Finalizado')
          ) THEN
            IF EXISTS (
              SELECT 1
              FROM "shifts" s
              JOIN "shift_status" ss ON ss.id = s.status_id
              WHERE LOWER(BTRIM(ss.name)) = LOWER('Finalizado')
            ) THEN
              UPDATE "shift_status"
              SET "is_active" = false
              WHERE LOWER(BTRIM(name)) = LOWER('Finalizado');
            ELSE
              DELETE FROM "shift_status"
              WHERE LOWER(BTRIM(name)) = LOWER('Finalizado');
            END IF;
          END IF;
        END IF;
      END
      $$;
    `);
  }
}
