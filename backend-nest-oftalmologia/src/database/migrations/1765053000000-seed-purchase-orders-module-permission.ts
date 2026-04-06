import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPurchaseOrdersModulePermission1765053000000
  implements MigrationInterface
{
  name = 'SeedPurchaseOrdersModulePermission1765053000000';

  private readonly moduleId = '607b9108-9dfd-45a8-b75a-22c6974d7fd4';
  private readonly viewPermissionId = 'bb505d45-47d5-4205-acbc-88d8ce4287f4';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "modules" ("id", "module_name", "description", "is_active")
      VALUES (
        '${this.moduleId}',
        'Orden de Pedido',
        'Este modulo contiene las ordenes de compras que se han hecho en el sistema',
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
        'Ver Modulo de Orden de Pedido',
        'Este permiso permite ver y ocultar el modulo de orden de pedido',
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
