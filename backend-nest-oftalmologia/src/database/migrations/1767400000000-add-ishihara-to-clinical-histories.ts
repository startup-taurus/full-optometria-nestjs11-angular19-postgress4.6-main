import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIshiharaToClinicalHistories1767400000000
  implements MigrationInterface
{
  name = 'AddIshiharaToClinicalHistories1767400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clinical_histories"
      ADD COLUMN IF NOT EXISTS "ishihara" character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clinical_histories"
      DROP COLUMN IF EXISTS "ishihara";
    `);
  }
}
