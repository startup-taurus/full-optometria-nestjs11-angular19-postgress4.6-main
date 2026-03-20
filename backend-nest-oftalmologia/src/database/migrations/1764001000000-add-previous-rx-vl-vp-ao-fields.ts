import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreviousRxVlVpAoFields1764001000000
  implements MigrationInterface
{
  name = 'AddPreviousRxVlVpAoFields1764001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clinical_histories"
      ADD COLUMN IF NOT EXISTS "previous_od_vl" character varying,
      ADD COLUMN IF NOT EXISTS "previous_od_vp" character varying,
      ADD COLUMN IF NOT EXISTS "previous_oi_vl" character varying,
      ADD COLUMN IF NOT EXISTS "previous_oi_vp" character varying,
      ADD COLUMN IF NOT EXISTS "previous_ao" character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clinical_histories"
      DROP COLUMN IF EXISTS "previous_ao",
      DROP COLUMN IF EXISTS "previous_oi_vp",
      DROP COLUMN IF EXISTS "previous_oi_vl",
      DROP COLUMN IF EXISTS "previous_od_vp",
      DROP COLUMN IF EXISTS "previous_od_vl";
    `);
  }
}
