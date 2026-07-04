import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSubscriptionModulePermission1767500001000
  implements MigrationInterface
{
  name = 'SeedSubscriptionModulePermission1767500001000';

  private readonly moduleId = 'd2b8e6a4-1c7f-4a3e-9b21-5f8c0a4d6e10';
  private readonly viewPermissionId = 'e3c9f7b5-2d80-4b4f-ac32-60a9d1b7f021';
  private readonly managePermissionId = 'f4daa8c6-3e91-4c50-bd43-71bae2c80132';
  private readonly targetRoles = ['SUPER_ADMIN', 'ADMIN'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "modules" ("id", "module_name", "description", "is_active")
      VALUES (
        '${this.moduleId}',
        'SUBSCRIPTION',
        'Modulo para administrar la suscripcion de la optica a Dioptrika',
        true
      )
      ON CONFLICT ("id") DO UPDATE SET
        "module_name" = EXCLUDED."module_name",
        "description" = EXCLUDED."description",
        "is_active" = true
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "permission_name", "description", "is_active", "module_id")
      VALUES
        (
          '${this.viewPermissionId}',
          'VIEW_SUBSCRIPTION',
          'Permite ver la seccion de suscripcion de la optica',
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
      SELECT r.id, p.id, true
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r."role_name" IN ('${this.targetRoles.join("', '")}')
        AND p.id IN ('${this.viewPermissionId}')
      ON CONFLICT ("role_id", "permission_id")
      DO UPDATE SET "is_enabled" = true
    `);

    await queryRunner.query(`
      INSERT INTO "role_modules" ("role_id", "module_id", "is_enabled")
      SELECT r.id, '${this.moduleId}', true
      FROM "roles" r
      WHERE r."role_name" IN ('${this.targetRoles.join("', '")}')
      ON CONFLICT ("role_id", "module_id")
      DO UPDATE SET "is_enabled" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN ('${this.viewPermissionId}', '${this.managePermissionId}')
    `);

    await queryRunner.query(`
      DELETE FROM "role_modules"
      WHERE "module_id" = '${this.moduleId}'
    `);

    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "id" IN ('${this.viewPermissionId}', '${this.managePermissionId}')
    `);

    await queryRunner.query(`
      DELETE FROM "modules"
      WHERE "id" = '${this.moduleId}'
    `);
  }
}
