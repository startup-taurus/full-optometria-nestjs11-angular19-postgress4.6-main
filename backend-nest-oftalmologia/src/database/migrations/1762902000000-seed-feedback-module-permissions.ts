import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedFeedbackModulePermissions1762902000000
  implements MigrationInterface
{
  name = 'SeedFeedbackModulePermissions1762902000000';

  private readonly moduleId = 'c828ad37-33c9-4949-b99a-f8b8ff21a085';
  private readonly viewPermissionId = '7ec21b5c-03fa-415c-b6de-59fea2dd2cea';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "modules" ("id", "module_name", "description", "is_active")
      VALUES (
        '${this.moduleId}',
        'Feedback',
        'Este modulo sirve para enviar sugerencias, quejas y demas ideas',
        true
      )
      ON CONFLICT ("id") DO UPDATE SET
        "module_name" = EXCLUDED."module_name",
        "description" = EXCLUDED."description",
        "is_active" = true
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "permission_name", "description", "is_active", "module_id")
      VALUES (
        '${this.viewPermissionId}',
        'Ver Modulo de Feedback',
        'Este permiso permite ver u ocultar el modulo de feedback',
        true,
        '${this.moduleId}'
      )
      ON CONFLICT ("id") DO UPDATE SET
        "permission_name" = EXCLUDED."permission_name",
        "description" = EXCLUDED."description",
        "is_active" = true,
        "module_id" = EXCLUDED."module_id"
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id", "is_enabled")
      SELECT r.id, '${this.viewPermissionId}', true
      FROM "roles" r
      WHERE r."role_name" = 'SUPER_ADMIN'
      ON CONFLICT ("role_id", "permission_id")
      DO UPDATE SET "is_enabled" = true
    `);

    await queryRunner.query(`
      INSERT INTO "role_modules" ("role_id", "module_id", "is_enabled")
      SELECT r.id, '${this.moduleId}', true
      FROM "roles" r
      WHERE r."role_name" = 'SUPER_ADMIN'
      ON CONFLICT ("role_id", "module_id")
      DO UPDATE SET "is_enabled" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" = '${this.viewPermissionId}'
    `);

    await queryRunner.query(`
      DELETE FROM "role_modules"
      WHERE "module_id" = '${this.moduleId}'
    `);

    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "id" = '${this.viewPermissionId}'
    `);

    await queryRunner.query(`
      DELETE FROM "modules"
      WHERE "id" = '${this.moduleId}'
    `);
  }
}
