import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitRbac1692123456789 implements MigrationInterface {
  name = 'InitRbac1692123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role_name" character varying NOT NULL,
        "description" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_role_name" UNIQUE ("role_name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // Create modules table
    await queryRunner.query(`
      CREATE TABLE "modules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "module_name" character varying NOT NULL,
        "description" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_module_name" UNIQUE ("module_name"),
        CONSTRAINT "PK_modules" PRIMARY KEY ("id")
      )
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "permission_name" character varying NOT NULL,
        "description" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "module_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "email" character varying NOT NULL,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "role_id" uuid NOT NULL,
        "profile_photo" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_locked" boolean NOT NULL DEFAULT false,
        "failed_login_attempts" integer NOT NULL DEFAULT 0,
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_username" UNIQUE ("username"),
        CONSTRAINT "UQ_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create role_permissions junction table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id")
      )
    `);

    // Create role_modules junction table
    await queryRunner.query(`
      CREATE TABLE "role_modules" (
        "role_id" uuid NOT NULL,
        "module_id" uuid NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_role_modules" PRIMARY KEY ("role_id", "module_id")
      )
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "permissions"
      ADD CONSTRAINT "FK_permissions_module"
      FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_role"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_role_permissions_role"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions"
      ADD CONSTRAINT "FK_role_permissions_permission"
      FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_modules"
      ADD CONSTRAINT "FK_role_modules_role"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "role_modules"
      ADD CONSTRAINT "FK_role_modules_module"
      FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_username" ON "users" ("username")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_role_id" ON "users" ("role_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_permissions_module_id" ON "permissions" ("module_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_permissions_module_id"`);
    await queryRunner.query(`DROP INDEX "IDX_users_role_id"`);
    await queryRunner.query(`DROP INDEX "IDX_users_username"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "role_modules" DROP CONSTRAINT "FK_role_modules_module"`
    );
    await queryRunner.query(
      `ALTER TABLE "role_modules" DROP CONSTRAINT "FK_role_modules_role"`
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permission"`
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_role"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_role"`
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "FK_permissions_module"`
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "role_modules"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "modules"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
