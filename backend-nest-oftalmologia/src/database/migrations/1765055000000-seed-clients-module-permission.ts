import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedClientsModulePermission1765055000000
  implements MigrationInterface
{
  name = 'SeedClientsModulePermission1765055000000';

  private readonly moduleId = 'bdf9c4f6-e607-4bce-9f88-490ef5b65d36';
  private readonly viewPermissionId = '3a759a8f-544a-4625-875a-ffd38c44f577';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "modules" ("id", "module_name", "description", "is_active")
      VALUES (
        '${this.moduleId}',
        'Clientes',
        'Este modulo permite ver u ocultar los clientes del sistema',
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
        'Ver Módulo de Clientes',
        'Este permiso permite ver u ocultar el modulo de clientes',
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
