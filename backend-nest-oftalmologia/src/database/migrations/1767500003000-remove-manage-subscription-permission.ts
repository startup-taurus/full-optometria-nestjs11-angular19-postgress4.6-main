import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveManageSubscriptionPermission1767500003000
  implements MigrationInterface
{
  name = 'RemoveManageSubscriptionPermission1767500003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions"
        WHERE "permission_name" = 'MANAGE_SUBSCRIPTION'
      )
    `);

    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "permission_name" = 'MANAGE_SUBSCRIPTION'
    `);
  }

  public async down(): Promise<void> {
    return;
  }
}
