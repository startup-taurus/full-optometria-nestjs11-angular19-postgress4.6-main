import { MigrationInterface, QueryRunner } from 'typeorm';

export class GrantSubscriptionPermissionToCompanyAdmins1767500002000
  implements MigrationInterface
{
  name = 'GrantSubscriptionPermissionToCompanyAdmins1767500002000';

  private readonly viewPermissionId = 'e3c9f7b5-2d80-4b4f-ac32-60a9d1b7f021';
  private readonly managePermissionId = 'f4daa8c6-3e91-4c50-bd43-71bae2c80132';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id", "is_enabled")
      SELECT r.id, p.id, true
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r."company_id" IS NOT NULL
        AND p.id IN ('${this.viewPermissionId}')
        AND EXISTS (
          SELECT 1
          FROM "role_permissions" rp
          JOIN "permissions" perm ON perm.id = rp."permission_id"
          WHERE rp."role_id" = r.id
            AND rp."is_enabled" = true
            AND perm."permission_name" = 'mostrar usuarios'
        )
      ON CONFLICT ("role_id", "permission_id")
      DO UPDATE SET "is_enabled" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions" rp
      USING "roles" r
      WHERE rp."role_id" = r.id
        AND r."company_id" IS NOT NULL
        AND rp."permission_id" IN ('${this.viewPermissionId}', '${this.managePermissionId}')
    `);
  }
}
